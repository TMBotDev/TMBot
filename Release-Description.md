# TMBot Release Note

#### Version 1.0.2

## 更新描述：无

## 修复Bug

1. 修复因为更换ws库的原因造成旧代码的重连bug

## 新增特性

###

1. 为底层ws客户端类添加监听onDestroy
2. 为Version添加debug属性,插件可自觉判断并做出一些操作（将FileClass的debug输出给弄到这里了）

***
请在你正在使用的WS实例销毁时一并结束你的插件的一切工作,Example：

```
let tmp = BotDockingMgr.getBot("xxx");
let sid = setInterval(()=>{},1000);
tmp.Client.events.onDestroy.on(()=>{
    clearInterval(sid);
})
```

***
