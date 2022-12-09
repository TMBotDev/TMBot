if [ ! -d "node_modules" ];then
    echo "依赖不存在！将开始安装依赖"
    echo "按任意键开始安装依赖"
    a=114514
    read -p "请按任意键继续..." a
    npm i

else
    echo "依赖存在！开始运行..."
	node ./app.js
    fi
