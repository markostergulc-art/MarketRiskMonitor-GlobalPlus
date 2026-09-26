#!/usr/bin/env python3
import struct, sys, zipfile
from pathlib import Path
p=Path(sys.argv[1])
b=p.read_bytes()
with zipfile.ZipFile(p) as z:
    bad=z.testzip()
    if bad:
        raise SystemExit(f'FAIL ZIP entry: {bad}')
    checked=0
    for i in z.infolist():
        if i.compress_type != zipfile.ZIP_STORED:
            continue
        off=i.header_offset
        name_len=struct.unpack_from('<H',b,off+26)[0]
        extra_len=struct.unpack_from('<H',b,off+28)[0]
        data_off=off+30+name_len+extra_len
        if data_off % 4:
            raise SystemExit(f'FAIL alignment: {i.filename} offset={data_off} mod4={data_off%4}')
        checked += 1
print(f'PASS ZIP integrity and 4-byte alignment for {checked} STORED entries')
