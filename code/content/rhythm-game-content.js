window.pageContent = {
  title: 'リズムゲーム',
  sections: [
    {
      paragraphs: [
        'ホロドリでは、各楽曲にEASY、NORMAL、HARD、EXPERTの4種類の難易度が登場します。',
        { text: '自分に合った難易度で楽しみましょう。', className: 'double-space' },
        'ホロライブドリームスのリズムゲームでは',
        { html: '<span class="emphasis-section">「タップノーツ」「ロングノーツ」「フリックノーツ」</span>' },
        { text: 'の3種類のノーツが存在します。', className: 'double-space' },
        '判定は',
        { html: '<span class="emphasis-section">「<span class="perfect">PERFECT</span>」「GREAT」「GOOD」「BAD」「MISS」</span>' },
        { text: 'の5種類です。', className: 'double-space2' }
      ]
    },
    {
      heading: 'ノーツの種類',
      paragraphs: [
        { html: '<span class="color-blue">タップノーツ</span>' },
        { type: 'image', src: 'rhythm_img/tap.png', alt: 'タップノーツ' },
        { html: 'ノーツが流れてきたときに、タイミングよくタップすることで「<span class="perfect">PERFECT</span>」を取れます。' },
        { text: '黄色・灰色のタップノーツが流れてくることがありますが、取り方は変わりません。', className: 'double-space' }
      ]
    },
    {
      paragraphs: [
        { html: '<span class="color-green">ロングノーツ</span>' },
        { type: 'image', src: 'rhythm_img/long.png', alt: 'ロングノーツ' },
        { html: 'ノーツがレーンに重なっている間、長押しすることで「<span class="perfect">PERFECT</span>」が取れます。' },
        'ホロライブドリームスのロングノーツは最後にタイミングよく離す必要はありません。',
        { text: '最後がフリックノーツになっていることがあります。', className: 'double-space' }
      ]
    },
    {
      paragraphs: [
        { html: '<span class="color-red">フリックノーツ</span>' },
        { type: 'image', src: 'rhythm_img/flick.png', alt: 'フリックノーツ' },
        { html: 'ノーツがレーンに重なった時に任意の方向に指を擦ることで「<span class="perfect">PERFECT</span>」を取れます。' },
        '連続で降ってきた場合は、1回1回指を離す必要はなく、画面をなぞり続けることで連続で取ることができます。',
        { text: '黄色のフリックノーツが流れてくることがありますが、取り方は変わりません。', className: 'double-space2' }
      ]
    },
    {
      heading: 'ノーツの判定',
      paragraphs: [
        '判定情報は確認でき次第、追記予定です。'
      ]
    }
  ],
  noteHtml: '当ページの説明は許可をいただき、一部<a href="https://seesaawiki.jp/hololivedreams/d/%cd%d1%b8%ec%bd%b8#long_notes" target="_blank">hololive Dreams非公式攻略wiki</a>を参考にしています。'
};
