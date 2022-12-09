# TMBot介绍
## TMBot是以Websocket连接与有着OneBot标准的软件建立连接，并实现接口的插件加载框架
---
- 如要创作插件
* 这篇README可能为你带来帮助
---
* TMBot框架的插件是以Node包形式存在，
所以你可以在你的项目里随意引用所有模块

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
tools/logger: Logger\

3. TMBot是先登录完成所有配置的WS连接然后再加载插件的
4. TMBot已经实现了OneBot标准的连接，你可以使用 modules/BotDockingMgr 的 BotDockingMgr.getBot 来获取已连接实例
5. TMBot插件必须要用户自行在插件目录安装插件的所有依赖才可以正常运行插件(TMBot不会为你的插件执行npm i命令)
6. TMBot会自行检索插件的package.json所规定的依赖是否在插件目录是否完整
7. TMBot插件发行形式必须以Node包的形式发布!不要包含TMBot的任何东西!不要修改源代码!必须可以直接解压至plugins目录运行!