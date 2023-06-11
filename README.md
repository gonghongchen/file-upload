## 已支持
* 在任意目录内上传文件
* 在任意目录内下载单文件
* 展示当前目录下的目录&文件列表
* 打开下一目录
* 删除任意目录/文件
* 在当前目录下创建新目录
* 展示文件的创建时间和大小

## 待支持
* 批量删除文件
* 文件/目录通过icon区分


## 在服务器端运行 server
* 在项目的 `package.json` 内添加两条运行命令：
  ```json
  "scripts": {
    "dev": "cross-env NODE_ENV=development npx nodemon index.js",
    "prod": "cross-env NODE_ENV=production node index.js"
  },
  ```
  `cross-env` 是用于在命令行里面添加环境变量的第三方库，这样在 server 的 node 环境中就可以通过 `process.env.NODE_ENV` 访问当前的环境变量了。
* 把 server 文件整个放到服务器后，用终端通过 `npm i` 安装包后，再运行 `npm run prod` 即可运行服务端，但这样的话关闭终端后服务就挂了，为了实现服务端的持久化运行，用到了 [`pm2`](https://www.npmjs.com/package/pm2?activeTab=readme) 这个库，安装流程如下：
  
  先全局安装：
  ```sh
  npm i pm2 -g
  ```
  然后找到 pm2 在 node 中的可执行程序的位置，一般就是在 nodejs 安装目录的 bin 目录下，比如我的就是：/www/server/nodejs/v16.9.0/bin。找到后执行下面的命令，建立软连接，实现全局使用：
  ```sh
  ln -s /www/server/nodejs/v16.9.0/bin/pm2 /usr/bin/pm2
  ```
  安装好 `pm2` 后，就可以通过命令 `pm2 start index.js` 来让一个服务保持持久运行了，但如何同 `pm2` 来运行 npm 命令呢？[这里](https://blog.csdn.net/qq_39085895/article/details/122166550)有详细使用介绍，在终端打开的目录路径和当前项目的 `package.json` 处于统一目录时，这样运行就OK了：
  ```sh
  pm2 start npm --name file-server --run prod
  ```
  后面改动服务端文件后，执行重启命令即可生效：
  ```sh
  pm2 restart [name]
  ```
