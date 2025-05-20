#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const tinify = require("tinify");
const ProgressBar = require('progress');
const Table = require('cli-table');
const { Command } = require('commander');
const glob = require('glob');

const {
  getProjectRootPath,
  isFileExisted,
  getDefaultOptions,
  readCacheFromFile,
  writeToFile,
} = require('./utils');
const package = require('./package.json');
const { name, version, description } = package;

const program = new Command();
program
  .name(name)
  .description(description)
  .version(version);

program
  .requiredOption('-c, -conf <string>', 'conf file path');

program.parse(process.argv);
const params = program.opts();
const { Conf } = params;

const rootPath = getProjectRootPath(process.cwd());
if (!rootPath) {
  console.log('Error: 未找到package.json, 请在项目中执行该命令。');
  process.exit(0);
}

const confFilePath = path.join(rootPath, Conf);
if (!isFileExisted(confFilePath)) {
  console.log('Error: 配置文件不存在，请确认路径是否正确。');
  console.log(`文件路径：${confFilePath}`);
  process.exit(0);
}


let options = require(confFilePath);
options = {
  ...getDefaultOptions(),
  ...options,
};

const { tinyKeys, entryPath } = options;
if (!tinyKeys.length) {
  console.log('Error: 请配置tiny key，需要前往：https://tinypng.com/ 申请');
  process.exit(0);
}

if (!entryPath) {
  console.log('Error: 请配置需要扫描的文件夹');
  process.exit(0);
}

const cacheFilePath = path.resolve(confFilePath, '../tiny-cache.json');

const compressImage = async (fileList) => {
  const cache = await readCacheFromFile(cacheFilePath);
  const table = new Table({
    head: ['file', 'origin size', 'after size'],
    colWidthd: [100, 100, 100],
  });

  const formateSize = (size) => {
    if (size < 1024) {
      return `${size}B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)}K`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)}M`;
  };

  const { replaceOriginImage } = options;
  const keyLen = tinyKeys.length;

  const bar = new ProgressBar('  compressing [:bar] :percent :etas', {
    width: 20,
    total: fileList.length
  });

  fileList.forEach(async (file, index) => {
    const { name, size } = file;
    const filePath = file.fullpath();
    const keyIndex = index % keyLen;
    tinify.key = tinyKeys[keyIndex];

    const source = tinify.fromFile(filePath);

    let targetFileName = name;
    if (!replaceOriginImage) {
      targetFileName = name.replace(imageSuffixReg, '_tiny$1');
    }

    const targetFilePath = filePath.replace(name, targetFileName);
    await source.toFile(targetFilePath);

    const stat = fs.statSync(targetFilePath);
    table.push([name, formateSize(size), formateSize(stat.size)]);

    const relativeFilePath = filePath.replace(rootPath, '');
    cache[relativeFilePath] = stat.mtime.getTime();

    bar.tick();
    if (bar.complete) {
      console.log('\n');
      console.log(table.toString());
      console.log('\压缩完成！\n');
      writeToFile(cacheFilePath, cache);
    };
  });
}


const main = async () => {
  const cache = await readCacheFromFile(cacheFilePath);
  const fileList = await glob(entryPath, {
    stat: true,
    withFileTypes: true,
    nodir: true,
    ignore: {
      ignored: (file) => {
        const { mtime, size } = file;

        // 首次进来没有size信息，这时候不忽略任何文件
        if (!size) {
          return false
        }

        const filePath = file.fullpath();
        const { minSize } = options;
        const relativeFilePath = filePath.replace(rootPath, '');

        return !(size >= minSize * 1024 && (!cache[relativeFilePath] || mtime > cache[relativeFilePath]));
      }
    }
  });

  console.log(`找到文件: ${fileList.length}个`);

  if (fileList.length) {
    console.log('开始压缩:');
    compressImage(fileList);
  }
}

main();
