apt update && apt upgrade
apt install -y curl wget vim
apt install -y git screen
screen -S oneinstack
git clone https://github.com/mocha888/note.git
cd note/oneinstack
chmod +x install.sh && ./install.sh --nginx_option 1 --php_option 11 --phpcache_option 1 --php_extensions redis --phpmyadmin --db_option 2 --dbinstallmethod 2 --dbrootpwd 3cu378qa --redis --iptables --ssh_port 28888