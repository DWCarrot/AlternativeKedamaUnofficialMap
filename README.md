# AlternativeKedamaUnofficialMap

Alternative plan for repo [SilentDepth/KedamaMC-Unofficial-Map](https://github.com/SilentDepth/KedamaMC-Unofficial-Map), using leaflet for display and matlab for processing

[毛玉線圈物語 Sunshine (v2) 非官方地图](https://github.com/SilentDepth/KedamaMC-Unofficial-Map) 备用方案，使用leaflet作地图显示，~~matlab(app)处理地图数据~~

基础图源来自SilentDepth/KedamaMC-Unofficial-Map(赞美鹅叔！)

### [[github-preview]](https://dwcarrot.github.io/AlternativeKedamaUnofficialMap/view/kedama-map.html)



主页面请见gh-pages分支(branch)

## 文件说明
- [package.json](package.json) node.js开发工程设置

​	注意其中外部依赖项(devDependencies) 的"lite-server"只是一个服务器，不是必须的，可以删掉

- [tsconfig.json](tsconfig.json) typescript工程设置
- [build.ps1](build.ps1) windows下记录一些常用编译拷贝指令，比如开启lite-server，编译，将css复制到指定文件夹等
- src/ 源码文件；入口是[main.ts](src/main.ts)，主要处理一些requirejs相关内容；地图正真的功能入口是[view/akm.ts](src/view/akm.ts)；
- build/ 编译后文件夹