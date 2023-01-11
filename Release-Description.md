# TMBot Release Note
#### Version 1.0.2

## 更新描述：无

## 修复Bug：无

## 新增特性：

### 请在你正在使用的WS实例销毁时一并结束你的插件的一切工作,例子：

```
let tmp = BotDockingMgr.getBot("xxx");
let sid = setInterval(()=>{},1000);
tmp.Client.events.onDestroy.on(()=>{
    clearInterval(sid);
})
```


