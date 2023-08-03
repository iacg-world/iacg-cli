## 本地调试
pnpm 连接bin执行文件到全局pnpm，方便命令执行
```bash
pnpm link @iacg-cli/core -g
```

指定本地依赖目录进行调试
```bash
iacg-cli init -d -tp ~/AppData/Local/pnpm/global/5/node_modules/iacg-cli/packages/commands/init/
```
