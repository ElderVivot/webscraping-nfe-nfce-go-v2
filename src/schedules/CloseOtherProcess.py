import psutil
from datetime import datetime
from dateutil.relativedelta import relativedelta

for proc in psutil.process_iter(['cmdline', 'exe', 'name', 'cwd', 'username', 'create_time', 'pid', 'status']):
    try:
        if proc.info['name'] == 'node.exe':
            cwd: str = proc.info['cwd']

            createTime = datetime.fromtimestamp(proc.info['create_time'])
            nowLess2Minutes = datetime.now() - relativedelta(minutes=2)

            if cwd.find('webscraping-nfe-nfce-go-v2') >= 0 and createTime < nowLess2Minutes:
                proc.kill()
    except Exception:
        pass
