@echo off

if exist node_modules (
    echo 依赖存在!开始运行!
    node app.js
    pause
    exit
) else (
    echo 依赖不存在!按下任意键开始安装!(请确认node环境)
    pause
    npm i
)