import dataflows as DF
import re
import requests
import shutil

WORDS = re.compile(r'\w+')

if __name__ == '__main__':
    download = DF.Flow(
        DF.load('https://raw.githubusercontent.com/voteview/member_photos/main/members.csv'),
        DF.filter_rows(lambda row: row['congress'] == '117'),
        DF.filter_rows(lambda row: row['chamber'] == 'House'),
        DF.add_field('filename', type='string', default=lambda row: '_'.join(WORDS.findall(row['name'].lower())) + '.jpg'),
        DF.select_fields(['filename', 'image']),
    ).results()[0][0]
    print(download)
    for row in download:
        with open('sources/' + row['filename'], 'wb') as f:
            url = 'https://raw.githubusercontent.com/voteview/member_photos/main/' + row['image']
            f.write(requests.get(url).content)
        