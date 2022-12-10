![Logo](./logo.png)
# TMBot介绍
## TMBot是以Websocket连接与有着OneBot标准的软件建立连接，并实现接口的插件加载框架
---
- 如要创作插件
* 这篇README可能为你带来帮助
---
* TMBot框架的插件是以Node包形式存在，
所以你可以在你的项目里随意引用所有模块

(请不要随意"使用"内部功能实现的模块)
如：OneBotDocking， PluginLoader，Websocket

虽然不可以使用，但是可以引用它内部的方法作为参数类型

---

## 开发注意事项
此框架可以运行于LiteLoaderBDS与NodeJS上
### 但是！！你要注意，在NodeJS环境上运行，根目录是直接作用于项目目录的
### 在LiteLoaderBDS上，根目录是作用于BDS目录上的！
### 所以可以使用 [FileClass.getStandardPath(<相对目录>)] 来获取作用于项目路径的绝对路径来避免此类BUG出现
#### TIPS: TMBot的基础接口实现已经全部使用了上述方法，所以可以直接传入作用于项目的相对路径


---

1. 首先，TMBot框架目录结构如下\
├───config //TMBot总配置目录(不要往这里操作任何东西!)\
├───modules //TMBot框架模块\
├───plugins //TMBot插件加载目录(在这里创建插件)\
│   └───Data //TMBot插件数据目录\
│       └───xxx //(最好每个创建都独立在Data目录创建一个文件夹，不要随意乱放)\
└───tools //TMBot用到的小工具

2. TMBot已经为你写好了一些基础接口实现，\
例如:\
tools/data: JsonConfigFileClass, IniConfigFileClass, \
tools/file: FileClass.readFrom, writeLine, createDir, delete, exists, copy, move, rename, getFileSize, checkIsDir, getFilesList,
tools/logger: Logger

3. TMBot是先登录完成所有配置的WS连接然后再加载插件的
4. TMBot已经实现了OneBot标准的连接，你可以使用 modules/BotDockingMgr 的 BotDockingMgr.getBot 来获取已连接实例
5. TMBot框架会自动为插件安装依赖,可以直接将没有node_modules的插件放入plugins运行
6. TMBot会自行检索插件的package.json所规定的依赖是否在插件目录是否完整
7. TMBot插件发行形式必须以Node包的形式发布!不要包含TMBot的任何东西!不要修改源代码!必须可以直接解压至plugins目录运行!