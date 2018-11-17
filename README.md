# AlternativeKedamaUnofficialMap

Alternative plan for repo [SilentDepth/KedamaMC-Unofficial-Map](https://github.com/SilentDepth/KedamaMC-Unofficial-Map), using leaflet for display and python-openCV for processing

[毛玉線圈物語 非官方地图](https://bbs.craft.moe/d/10-2-8/204) 备用方案，使用leaflet作地图显示，python-openCV处理地图数据

-----------

### [[github-preview]](https://dwcarrot.github.io/AlternativeKedamaUnofficialMap/view/kedama-map.html)

**[2018/11/12]  加入v3世界地图(scale=1:4 vanilla map);控制台切换世界;可以在URL中使用`#fragment`选择预设世界**                    赞美李德二！

基础图源来自SilentDepth/KedamaMC-Unofficial-Map(赞美鹅叔！)，利用python-openCV进行部分地图更新

[v2](https://dwcarrot.github.io/AlternativeKedamaUnofficialMap/view/kedama-map.html#v2)
[v3](https://dwcarrot.github.io/AlternativeKedamaUnofficialMap/view/kedama-map.html#v3)

-----------

## 更新方案
1. 设置`journey map` - `cartography` - (`Show Bathymetry`=TRUE, `Use Transparency`=FALSE)

   验证地图颜色与 [SilentDepth/KedamaMC-Unofficial-Map](https://github.com/SilentDepth/KedamaMC-Unofficial-Map)的相同

   ![设置界面](tools/tips/jm-settings.png)

2. 获取地形信息

3. 寻找对应存储地图文件的文件夹：

   * 可以在`.minecraft/journeymap/journeymap.log`找到当天的日志，或者`.minecraft/logs/XXXX-XX-XX-X.log.gz`找到对应日期的日志，日志中含有地图图片的保存位置信息，例如，下面的日志中记录了journeymap对应地图位置于`.minecraft/journeymap/data/mp/Kedama~Koiru~Monogatari_4b47df45~e481~4157~8624~4a75f0c9b1ff/DIM0`

     ![journeymap folder](tools/tips/jm-folder.png)

   * 一般来说所需要的文件位于上述文件夹下`day/`文件夹下，例如`.minecraft/journeymap/data/mp/Kedama~Koiru~Monogatari_4b47df45~e481~4157~8624~4a75f0c9b1ff/DIM0/day/`

     ![journeymap files](tools/tips/jm-file.png)

4. 选择所需更新的图片；文件名的坐标`(X,Z)`与实际坐标`(x,z)`满足：$X=floor(x/512), Z=floor(z/512)$,floor表示向下取整函数

5. 联系地图维护者提供图片



> 更新：利用python-opencv 的地图更新工具
>
> splitMap.py 读取、分割图片
>
> picHandler.py 透视变换矫正
>

-----------

### TODO

- [ ] \#20181112-02 水印(地图标题)
- [ ] \#20181112-02 标记点
- [ ] \#20181112-03区块划分线显示
- [ ] \#20181112-04`MinecraftMapManager.getMapMarkers()`,`MinecraftMapManager.getUserMarkers()`
- [ ] \#20181112-05 距离测量



