const path = require('path');
const fs = require('fs');

const DEFAULT_CACHE = {};
const imageSuffixReg = /(\.png|\.jpg)$/;

const isFileExisted = (filePath) => {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (error) {}

  return false;
};

const writeToFile = async (filePath, content) => {
  if (!content) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content);
    
    fs.writeFile(filePath, fileContent, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  });
};

const readCacheFromFile = async (filePath) => {
  const isExisted = isFileExisted(filePath);
  if (!isExisted) {
    await writeToFile(filePath, DEFAULT_CACHE);
    return DEFAULT_CACHE;
  }

  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

const walkDir = (entryPath) => {
  const fileList = [];
  const traverse = (dir) => {
    const dirContentList = fs.readdirSync(dir, { withFileTypes: true });
    dirContentList.forEach((item) => {
      const { name } = item;
      const filePath = path.join(dir, name);

      if (item.isFile() && imageSuffixReg.test(name)) {
        const stat = fs.statSync(filePath);
        const { mtime, size } = stat;
        
        fileList.push({filePath, name, mtime, size});
      } else if (item.isDirectory()) {
        traverse(filePath);
      }
    })
  }
  
  traverse(entryPath);
  return fileList;
};

const getProjectRootPath = (enterPath) => {
  let rootPath = '';
  let prevParent = '';

  const traverse = (dir) => {
    const dirContentList = fs.readdirSync(dir, { withFileTypes: true });
    const isRoot = dirContentList.find((item) => {
      const { name } = item;
      if (item.isFile() && name === 'package.json') {
        return true;
      }
    });

    if (isRoot) {
      rootPath = dir;
      return;
    }

    const parentRoot = path.resolve(dir, '..');
    if (parentRoot !== prevParent) {
      prevParent = parentRoot;
      traverse(parentRoot);
    }
  };

  traverse(enterPath);
  return rootPath;
};

const getDefaultOptions = () => {
  return {
    tinyKeys: [],
    entryPath: '',
    replaceOriginImage: true,
    minSize: 10,
  };
};

module.exports = {
  isFileExisted,
  writeToFile,
  readCacheFromFile,
  walkDir,
  getProjectRootPath,
  getDefaultOptions,
};
