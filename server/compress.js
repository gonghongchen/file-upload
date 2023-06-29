const fs = require('fs')
const archiver = require('archiver')
const path = require('path')

const compress = (curPath, files, callback) => {
  // 创建压缩文件的输出流
  const outputFile = 'temp_compress.zip'  // 打包压缩后的文件的临时名称
  const outputPath = path.resolve(__dirname, curPath, outputFile) // 打包压缩后的文件的完整路径
  const output = fs.createWriteStream(outputPath)
  const archive = archiver('zip', {
    zlib: { level: 9 } // 设置压缩级别
  })

  // 监听输出流的关闭事件
  output.on('close', () => {
    console.log('多文件打包压缩完成')
    // 打包压缩完成后将压缩文件返回给客户端
    callback?.(outputPath)
  })

  // 监听输出流的错误事件
  output.on('error', (err) => {
    console.error('压缩文件时发生错误：', err)
  })

  // 添加文件到压缩包
  files.forEach((file) => {
    const isFile = file.toString().includes('.')
    const filePath = path.resolve(__dirname, curPath, file)
    if (isFile) {
      // 文件处理
      const fileStream = fs.createReadStream(filePath)
      archive.append(fileStream, { name: file })
    } else {
      // 文件夹处理，archive.directory 这个方法会递归遍历文件夹的子文件及子文件夹，实现整个目录的压缩处理。
      // 第二个参数为 false 的情况下会将所有子文件全部移动到顶层文件夹内，给定文件夹名字的情况下则会输出为指定的名字，
      // 这里将输出名字依旧设置为原本的文件夹名字就可以保证打包后的目录结构保持不变了
      archive.directory(filePath, file);
    }
  })

  // 完成压缩
  archive.pipe(output)
  archive.finalize()

  // 返回压缩后生成的压缩包文件名
  return outputFile
}

module.exports = compress