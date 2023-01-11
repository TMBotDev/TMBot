@echo off
chcp 65001

if exist node_modules (
    echo 依赖存在!开始运行!
    node app.js
    goto end
) else (
    echo 依赖不存在!按下任意键开始安装! ·请确认node环境
    pause
    cmd /k npm i
    goto end
)
:end
echo 按下任意键关闭页面
pause