#!/bin/bash

export WORKSPACE='/opt/ServerStatus'
export OS_ARCH='x86_64'
export CHECK_URL='http://127.0.0.1:8080/report'

while [[ $# -ge 1 ]]; do
  case $1 in
    -u|--url)
      shift
      CHECK_URL="$1"
      shift
      ;;
   esac
done

echo -e "\n[\033[33m正在执行\033[0m]: 1.准备环境..."
apt install -y unzip
mkdir -p ${WORKSPACE}
cd ${WORKSPACE}


echo -e "\n[\033[33m正在执行\033[0m]: 2.下载软件..."

client_zip_name="client-${OS_ARCH}-unknown-linux-musl.zip"
latest_version=$(curl -m 10 -sL "https://api.github.com/repos/zdz/ServerStatus-Rust/releases/latest" | grep "tag_name" | head -n 1 | awk -F ":" '{print $2}' | sed 's/\"//g;s/,//g;s/ //g')
wget --no-check-certificate -qO "${WORKSPACE}/${client_zip_name}"  "https://github.com/zdz/ServerStatus-Rust/releases/download/${latest_version}/${client_zip_name}"


echo -e "\n[\033[33m正在执行\033[0m]: 3.修改配置..."

unzip -o ${client_zip_name}

# 命令行 ExecStart=/opt/ServerStatus/stat_client -a "http://127.0.0.1:8080/report" -u h1 -p p1
cmd="ExecStart=${WORKSPACE}/stat_client -a ${CHECK_URL} -g silent -p pp"
cmd_regx=${cmd//\//\\\/}
sed -ri "s/ExecStart=(.*)/${cmd_regx}/g" ${WORKSPACE}/stat_client.service

rm ${client_zip_name}

echo -e "\n[\033[33m正在执行\033[0m]: 4.启动软件..."

mv -v ${WORKSPACE}/stat_client.service /etc/systemd/system/stat_client.service
systemctl daemon-reload
systemctl start stat_client

# 状态查看
#systemctl status stat_client

# 使用以下命令开机自启
#systemctl enable stat_client

# 停止
# systemctl stop stat_server
# systemctl stop stat_client

# https://fedoraproject.org/wiki/Systemd/zh-cn
# https://docs.fedoraproject.org/en-US/quick-docs/understanding-and-administering-systemd/index.html

# 修改 /etc/systemd/system/stat_client.service 文件，将IP改为你服务器的IP或你的域名