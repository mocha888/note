#!/bin/bash

export CHECK_TIME='5'
export SSH_PORT='2222'

while [[ $# -ge 1 ]]; do
  case $1 in
    -p|--port)
      shift
      SSH_PORT="$1"
      shift
      ;;
   esac
done

echo -e "本次任务安装到SSH端口: \033[31m ${SSH_PORT} \033[0m，等待\033[33m ${CHECK_TIME} \033[0m秒后开始，可以用 Ctrl-C 取消安装"
sleep ${CHECK_TIME}

echo -e "\n[\033[33m正在执行\033[0m]: 1.证书登录..."

sed -ri 's/^#?Port [0-9]+/#Port 22/g' /etc/ssh/sshd_config
sed -ri 's/^#?PermitRootLogin yes/#PermitRootLogin yes/g' /etc/ssh/sshd_config
sed -ri 's/^#?PasswordAuthentication yes/#PasswordAuthentication yes/g' /etc/ssh/sshd_config

mkdir -p /root/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG8aYCx3HpGOiKal3F1dGeNw7fX/m3/LOrBdx8jYSCsV openpgp:0x77D40D07" > /root/.ssh/authorized_keys
echo "sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIHR/MD+xtkvzTJtaVSmXbTNTMb29EWoMFkQNzLB7sEfQAAAAC3NzaDp5dWJpa2V5 ssh:FIDO2" > /root/.ssh/authorized_keys2

chmod 600 /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys2
chmod 700 /root/.ssh

cat >/etc/ssh/sshd_config.d/myssh.conf<<EOF
Port ${SSH_PORT}

PermitRootLogin yes

PasswordAuthentication no

PubkeyAuthentication yes
AuthorizedKeysFile     .ssh/authorized_keys .ssh/authorized_keys2

EOF
systemctl restart sshd


echo -e "\n[\033[33m正在执行\033[0m]: 2.安装常用软件..."

apt update -y
apt upgrade -y
apt install -y curl wget vim htop


echo -e "\n[\033[33m正在执行\033[0m]: 3.开启防火墙端口..."

apt install -y ufw
ufw allow 22,${SSH_PORT}/tcp
echo "y" | ufw enable


echo -e "\n[\033[33m正在执行\033[0m]: 4.配置防御规则..."

apt install -y fail2ban
echo >/etc/fail2ban/jail.local<<EOF
[DEFAULT]
ignoreip = 127.0.0.1/8

bantime  = -1
findtime  = 10m
maxretry = 2

banaction = ufw
banaction_allports = ufw


[sshd]
enabled = true
port    = ssh,${SSH_PORT}
logpath = %(sshd_log)s
backend = %(sshd_backend)s

EOF
systemctl restart fail2ban
