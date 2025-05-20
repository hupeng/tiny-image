### 安装
```
npm install tiny-image --save-dev
```

### 添加配置文件
可以在项目任意位置添加配置文件，一个完整的文件内容包括：
```
// conf.js

module.exports = {
  tinyKeys: [
    'develop key from https://tinypng.com/',
    'develop key from https://tinypng.com/',
  ],
  // entryPath: 'src/assets/images/banner/**/*',
  entryPath: [
    'src/assets/images/banner/**/*',
    'src/assets/images/setting/*.jpg'
  ],
  replaceOriginImage: true,
  minSize: 10, // KB
};
```

### 配置说明
- `tinyKeys` 来自[tinypng.com](https://tinypng.com/)的开发key，一个key每月只能免费压缩500张图片，可以根据项目情况，多申请几个
- `entryPath` [`String | Array`] 需要扫描的文件夹，支持[glob](https://www.npmjs.com/package/glob)文件匹配模式
- `replaceOriginImage` 是否直接替换原文件，如果设置为`false`，会在原位置创建一个加有`_tiny`后缀的文件
- `minSize` 需要压缩的最小图片尺寸，单位为KB，默认值10KB

> 注意：目前只支持对PNG和JPG图片做压缩。

### 配置`script`
```
// package.json
...
"script": {
    ...
    "tiny-image": "tiny-image -c build/tinyimage/conf.js"
}

```

### 压缩
```
npm run tiny-image
```

> 注意：压缩结束之后，会在配置文件同级目录下创建一个缓存文件：`tiny-cache.json`，为了避免重复压缩，强烈建议把这个文件纳入git控制中。

![npm run tiny-image](https://wiki.firstshare.cn/download/attachments/221138870/image2023-3-15_17-21-35.png)

### 关于`cache.json`
经过压缩的图片会保留一条缓存记录，为`文件名: 最后修改时间戳`：
```
{
    "/src/assets/images/home/home_banner_right.png":1678870678662,
    "/src/assets/images/home/home_banner_left.png":1678870678670,
    "/src/assets/images/home/home_banner_middle.png":1678870680386
}
```

满足以下两个条件时候，图片会被加入到压缩队列中
- `cache.json`无记录
- `cache.json`中记录的时间戳小于当前图片最后修改的时间戳
