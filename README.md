# TMBot

OneBot标准的TMBot插件加载框架（WebsocketClient） 推荐使用go-cqhttp配合使用

<!-- PROJECT SHIELDS -->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br/>

<p align="center">
  <a href="https://github.com/TMBotDev/TMBot">
    <img src="logo.png" alt="Logo" width="378" height="400">
  </a>

  <h3 align="center">OneBot标准的TMBot插件加载框架</h3>
  <p align="center">
    使用它去创造你的第一个机器人插件！
    <br />
</a>
    <br />
    <br />
    <a href="https://github.com/TMBotDev/TMBot">查看仓库</a>
    ·
    <a href="https://github.com/TMBotDev/TMBot">报告Bug</a>
    ·
    <a href="https://github.com/TMBotDev/TMBot">提出新特性</a>
  </p>

</p>

## 目录

- [快速上手指南](#快速上手指南)
  - [配置文件注释](#配置文件注释)
  - [插件开发指南](#插件开发指南)
  - [用户安装指南](#用户安装指南)
- [文件目录说明](#文件目录说明)
- [使用到的框架](#使用到的框架)
- [贡献者](#贡献者)
  - [如何参与此项目](#如何参与此项目)
- [开发注意事项](#开发注意事项)
  - [一些额外注意事项](#一些额外注意事项)
- [版本控制](#版本控制)
- [作者](#作者)
- [版权说明](版权说明)
- [鸣谢](#鸣谢)

### 快速上手指南

1. 前往Releases页面下载最新的TMBot正式版
2. 安装go-cqhttp或其他OneBot标准的机器人后端,设置为正向ws连接(go-cqhttp链接：<https://github.com/Mrs4s/go-cqhttp>)
3. 启动TMBotStart.exe(Linux使用./TMBotStart)安装所需依赖
4. 重复3. ，在./config/文件夹找到config.json,更改ws地址，端口和你想改的东西
5. 修改配置文件后，启动机器人
6. Enjoy it ;)

***更多内容请参阅[插件开发指南](#插件开发指南)和[用户安装指南](#用户安装指南)***

#### 配置文件注释

```json
{
    "RoBot": {  //机器人名字
        "Websocket": "ws://127.0.0.1:22",      //你的ws地址和端口
        "ReConnectCount": 5,                   //重连次数，-1为不限
        "ReConnectTime": 4,                    //重连间隔时间，单位为秒
        "MsgLog": true,                        //消息日志是否启用
        "NoticeLog": true,                     //通知日志是否启用
        "LogFile": "RoBotLog-{Y}-{M}-{D}.log"  //日志文件名格式，Y为年，M为月，D为日
    }
}

```

#### 插件开发指南

1. 安装node.js(Linux上还要安装npm)
2. 克隆仓库或前往Releases下载TMBot框架
3. 运行一次TMBotStart，安装所需依赖
4. 下载go-cqhttp或其他OntBot协议的机器人作为后端(go-cqhttp链接：<https://github.com/Mrs4s/go-cqhttp>)
5. 下载插件模板：<https://github.com/TMBotDev/TMBot-Plugin-Demo.git>
6. 将插件安装进TMBot中
7. 运行TMBotStart，开始你的开发之旅

#### **用户安装指南**

1. 前往Releases 下载稳定版（推荐）或从Actions下载测试版（不推荐）

2. 安装必要的框架和依赖

```sh
sudo apt-get install nodejs npm #  Linux Debian系可以这样安装
# Windows用户请自行前往Node.JS官网安装
# 下载后解压到一个文件夹
# Windows 用户双击TMBotStart.exe即可安装依赖
# Linux 用户在此处打开终端，输入：
chmod +x ./TMBotStart && ./TMBotStart
```
3. 启动TMBot
```sh
./TMBotStart # Linux
TMBotStart.exe # Windows
```
### 文件目录说明

```json
FileTree:  
├── /config/     // TMBot总配置目录(您只应该去更改里面的config.json)
├── node_modules // TMBot所需的依赖
├── modules      // TMBot框架模块
└── /tools/      // TMBot用到的小工具
├── /plugins/    // TMBot插件加载目录(在这里创建插件)
    ├── /Data/   // TMBot插件数据目录 
    ├── xxx      // 插件数据(最好每个创建都独立在Data目录创建一个文件夹，不要随意乱放)
├── app.js       // TMBot的入口文件，正常情况下不应该修改
├── CONTRIBUTING.md // TMBot的贡献者名单（Clone Only）
├── LICENSE.txt  // 这个项目的许可证 （Clone Only）
├── logo.png     // RT.
├── package.json // （Clone Only）
├── README.md    // 您正在阅读的这个文件（Clone Only）
├── TMBotStart.exe // Windows 启动文件
├── TMBotStart   // Linux 启动文件

```

### 使用到的框架

暂无

### 贡献者

请阅读**CONTRIBUTING.md** 查阅为该项目做出贡献的开发者。

#### 如何参与此项目

贡献使开源社区成为一个学习、激励和创造的绝佳场所。你所作的任何贡献都是**让我们非常感谢**的。

1. Fork 这个项目
2. 创建你的"Feature Branch",例如 (```git checkout -b feature/AmazingFeature```)
3. Commit你的更改 (```git commit -m 'Add some Amazing Feature'```)
4. 将更改推到你的分支上 (```git push origin feature/AmazingFeature```)
5. 开始PR

### 开发注意事项

此框架可以运行于LiteLoaderBDS与NodeJS上
**但是请要注意，如果在`NodeJS环境上运行`，那么根目录是直接作用于`项目目录的`**

**而在`LiteLoaderBDS`上，根目录是作用于`BDS根目录`上的**

**所以可以使用**
```js
FileClass.getStandardPath(<相对目录>)
```
**来获取作用于项目路径的绝对路径来避免此类BUG出现**

*```TIPS: TMBot的基础接口实现已经全部使用了上述方法，所以可以直接传入作用于项目的相对路径```*


#### 一些额外注意事项

1. TMBot已经为你写好了一些基础接口实现，
例如:

```js
tools/data: JsonConfigFileClass,IniConfigFileClass,
tools/file: FileClass.readFrom,
            FileClass.writeLine,
            FileClass.createDir,
            FileClass.delete,
            FileClass.exists,
            FileClass.copy,
            FileClass.move,
            FileClass.rename,
            FileClass.getFileSize,
            FileClass.checkIsDir,
            FileClass.getFilesList,
tools/logger: Logger
```

2. TMBot是先登录完成所有配置的WS连接然后再加载插件的
3. TMBot已经实现了OneBot标准的连接，你可以使用 modules/BotDockingMgr 的 BotDockingMgr.getBot 来获取已连接实例
4. TMBot框架会自动为插件安装依赖,可以直接将没有node_modules的插件放入plugins运行
5. TMBot会自行检索插件的package.json所规定的依赖是否在插件目录是否完整
6. TMBot插件发行形式必须以Node包的形式发布!不要包含TMBot的任何东西!不要修改源代码!必须可以直接解压至plugins目录运行!
7. TMBot框架的插件是以Node包形式存在， 所以你可以在你的项目里随意引用所有模块
(请不要随意"使用"内部功能实现的模块) 如：```OneBotDocking```， ```PluginLoader```，```Websocket```。
虽然不可以使用，但是可以引用它内部的方法作为参数类型
8. 请在你正在使用的WS实例销毁时一并结束你的插件的一切工作,例子:
```js
let tmp = BotDockingMgr.getBot("xxx");
let sid = setInterval(()=>{},1000);
tmp.Client.events.onDestroy.on(()=>{
    clearInterval(sid);
})
```


### 版本控制

该项目使用Git进行版本管理。您可以在GitHub查看当前可用版本。 

### 作者

Timiya

MineBBS:提米吖  &ensp; qq:284696890

 *您也可以在贡献者名单中参看所有参与该项目的开发者。*

### 版权说明

该项目使用 GPL-V3 授权许可，详情请参阅 [LICENSE](https://github.com/TMBotDev/TMBot/blob/master/LICENSE)

### 鸣谢

<!-- links -->
[contributors-shield]: https://img.shields.io/github/contributors/TMBotDev/TMBot.svg?style=flat-square
[contributors-url]: https://github.com/TMBotDev/TMBot/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/TMBotDev/TMBot.svg?style=flat-square
[forks-url]: https://github.com/TMBotDev/TMBot/network/members
[stars-shield]: https://img.shields.io/github/stars/TMBotDev/TMBot.svg?style=flat-square
[stars-url]: https://github.com/TMBotDev/TMBot/stargazers
[issues-shield]: https://img.shields.io/github/issues/TMBotDev/TMBot.svg?style=flat-square
[issues-url]: https://img.shields.io/github/issues/TMBotDev/TMBot.svg
[license-shield]: https://img.shields.io/github/license/TMBotDev/TMBot.svg?style=flat-square
[license-url]: https://github.com/TMBotDev/TMBot/blob/master/LICENSE
