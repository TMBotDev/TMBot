@echo off

if exist node_modules (
    echo ��������!��ʼ����!
    node app.js
    pause
    exit
) else (
    echo ����������!�����������ʼ��װ!(��ȷ��node����)
    pause
    npm i
)