# TMBot Release Note

#### Version v1.0.9

## 更新描述：

[添加,添加,添加,完善](https://github.com/TMBotDev/TMBot/commit/3ca2bf3fb158a66c81492602fe8e3ebec8b87bc5) 
1.添加ForwardMessageInfo类
2.为OneBotDocking添加sendGroupForwardMsg, sendPrivateForwardMsg, getForwardMsgEx,  sendGroupForwardMsgEx, sendPrivateForwardMsgEx 属性
3.为SenderInfo类添加属性 _isGroupMember, _isGuildMember
4.完善ForwardNode类
5.完善MsgInfoBuilder类


[修改，添加](https://github.com/TMBotDev/TMBot/commit/aab6c41dba9a00f63e8d49d6ab2631ebb12a7f9c) 
1.添加一些注释
2.修改Event类为TEvent类（防止冲突）
3.为GuildSystem增加一个新文件
4.添加一些方便函数
5.将GuildSender改为GuildSenderInfo（看着舒服）
6.添加类ReactionInfo(s)

[添加&完善&修改&修复](https://github.com/TMBotDev/TMBot/commit/2fe1853aa77820d827aa55b4534ad3c49fdb3459)
1.添加tools/leveldb.ts,数据库
2.完善GuildSystem监听机制
3.修改ChannelInfo为GuildChannelInfo
4.修复在部分node环境中app会运行两次&添加Global.ts放入全局变量监听
5.添加MessageDB
(修复部分OneBot标准的服务器没有get_msg API导致的部分功能无法运行以及GuildSystem没有get_msg API导致的一些问题)

[完善成员缓存系统](https://github.com/TMBotDev/TMBot/commit/53a7cb1225e863517b069dfe709086b139b037eb)

[添加发送请求错误打印机制](https://github.com/TMBotDev/TMBot/commit/cd2f5f612e8dbb1b7542cb13814867e7e096b6d7) 
更改:OneBotDocking._SendReqPro
返回类型改为TMBotPromise(详情见源码)

[完善错报错机制&添加一些类toString方法](https://github.com/TMBotDev/TMBot/commit/557312fe5551589cac2b7da56cbf5d5efb8593f0) 
1.添加TEvent的打印错误插件名称的功能
2.添加未捕获异常打印错误插件名称的功能
3.添加QQChannelTypes文件夹里类的toString方法

[完善&添加&优化](https://github.com/TMBotDev/TMBot/commit/1f16efac69fb285c78ec7d5bf0620cd2064eee6f) 
1.完善命令系统(namespace TMBotCmd)
2.添加一些TMBot命令系统的基本命令
3.添加TMBotCmd.HelpCmdHelper(class)
4.优化掉一些沉余导入项
5.优化LevelDB在有打开数据库的情况下再关闭才输出全部关闭完成

[修复&修改](https://github.com/TMBotDev/TMBot/commit/f02026898cd8be8b19dd8fdf0e9147c407f222e0) 
修复LevelDB类在nodejs环境可能会报数据库未开启
修改LevelDB.getKeyIterator为异步方法

[添加debug模式（断点调试）&更新错误处理](https://github.com/TMBotDev/TMBot/commit/223eef2f6ec88b586226d4e53ba562b34814dca3)

[修复level包不安装的bug&移除部分无用的包&修复一个未定义变量bug](https://github.com/TMBotDev/TMBot/commit/ed5457046aa11ae75a51162c3412dc770d1f4805)

骗过ts编译器不提示缺失类
[1](https://github.com/TMBotDev/TMBot/commit/5de47cd9215c0c7aaf92d35b294aa7b2ab3c2706)[2](https://github.com/TMBotDev/TMBot/commit/a498f5a5900136ad5ff1abca3a6b32454737ee94)[3](https://github.com/TMBotDev/TMBot/commit/90c7cc726abe2e5d805cdbd74e86e7eeb6d6c01d)[4](https://github.com/TMBotDev/TMBot/commit/c65304a484fc84cda30d7c813c752d81790da327)

[修改初始化输出,添加无颜色模式](https://github.com/TMBotDev/TMBot/commit/8a9e5e2c1751e11a155f4e62681eba5f9f7fb4b4) 
1.修改一些初始化的输出格式
2.添加无颜色模式(在TMBot根目录添加NO_COLOR文件)

