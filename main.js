/*
  各種設定
*/
const TIMEOUT = 10000; //タイムアウト時間を設定（ms）
const POPUP_DELAY = 2000; //ポップアップが出るまでの遅延時間を設定(ms)
const POPUP_DISPLAY_TIME = 3000; //ポップアップの表示時間を設定(ms)



const nameInput = document.getElementById('name');
const displayButton = document.getElementById('displayButton');
const serchingText = document.getElementById('serchingText')
const popupText = document.getElementById('popupText');
const displayArea = document.getElementById('displayArea');

displayButton.addEventListener('click', (e) => {
  e.preventDefault();
  if(checkInput(nameInput.value)) return;
  displayWikipediaData(nameInput.value)
})


//Wikipediaのリストもしくはエラー画面を表示する関数
async function displayWikipediaData (title) {
  try {
    await generateList(title);
    await sleep(POPUP_DELAY);
    popup(POPUP_DISPLAY_TIME);
  } catch (error) {
    switch (error.message) {
      case "404":
        Show404Image ();
        break;
      case "timeout":
        ShowTimeout ();
        break;
      case "Failed to fetch":
        ShowFailedToFetch ();
        break;
      default:
        displayArea.innerHTML = `${error.message}`
        break;
    }
  } finally {
    nameInput.value = "";
    nameInput.focus();
  }
}

//ポップアップアニメーション
function popup(time) {
  const str = document.getElementById('birthDay').innerHTML;
  const birthYear = parseInt(str.substring(0, str.indexOf('年')));

  if (!birthYear) {
    popupText.innerHTML = "Unknown!!"
  } else if (birthYear <= 1964) {
    popupText.innerHTML = "Great man!!"
  } else if (birthYear <= 1994) {
    popupText.innerHTML = "Old man!!"
  } else {
    popupText.innerHTML = "Young man!!"
  }
  popupText.classList.add('animated');
  setTimeout(() => {
    popupText.classList.remove('animated');
  }, time);
}

//待機する関数
function sleep(time) {
  return new Promise (resolve => setTimeout(resolve,time))
}


//Wikipediaからデータをfetchしてくる関数
async function fetchWikipediaData(title) {
  const url = `https://ja.wikipedia.org/api/rest_v1/page/summary/${title}`
  try {
    const res = await Promise.race([
      fetch(url),
      //タイムアウト処理(10秒)
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT))
    ]);
    if (!res.ok) {
      //404(記事なし)だったらcatchへ
      throw new Error('404');
    }
    return await res.json();
  } catch (error) {
    return Promise.reject(error);
  }
}

//引数に対応したデータリストを出力する関数
async function generateList(pageTitle) {
  try {
    displayArea.innerHTML = "";
    serchingText.classList.add("active");
    const data = await fetchWikipediaData(pageTitle)
    const { title, thumbnail, extract } = data
    let birthDay;
    
    //画像を読み込んでから出力するための記述(リストを出力しながら画像を読み込むのはなんかダサいので) 
    let imgsrc = thumbnail ? thumbnail.source : "https://placehold.jp/30/888888/ffffff/300x150.png?text=no+image";
    const img = new Image();
    img.src = imgsrc;

    //Promise.allで画像読み込みと生年月日取得を同時に行うことで時間短縮
    await Promise.all([
      getBirthDay(title),
      new Promise(resolve => {
        img.onload = () => resolve();
      })
    ]).then(res => {
      birthDay = res[0];
    })
    
    serchingText.classList.remove("active");
    displayArea.innerHTML = `
	    <dl>
	      <dt>名前</dt>
	      <dd>${title}</dd>
	      <dt>プロフィール画像</dt>
	      <dd id = "image">
	      </dd>
	      <dt>生年月日</dt>
	      <dd id="birthDay">${birthDay}</dd>
	      <dt>概要</dt>
	      <dd>${extract}</dd>
	    </dl>
	  `
    document.getElementById("image").appendChild(img)
  } catch (error) {
    serchingText.classList.remove("active");
    return Promise.reject(error);
  }
}


//エラー画像とメッセージを表示する関数
async function Show404Image () {
  const rand = Math.floor(Math.random() * 10) + 1; // 1~10の乱数
  const img = new Image();
  img.src = `images/error${rand}.png`;
  img.width = 500;
  await new Promise(resolve => {
    img.onload = () => resolve();
  })

  displayArea.innerHTML = `
    <figure id="errorImage"></figure>
    <p>お探しの人物は見つかりませんでした。</p>
  `
  document.getElementById("errorImage").appendChild(img)
}

//タイムアウトの時の処理
function ShowTimeout () {
  displayArea.innerHTML = `
    タイムアウトしました。
  `
}

function ShowFailedToFetch() {
  displayArea.innerHTML = `
    情報を取得できませんでした。ネットがつながっているか確認してください。
  `
}

//引数のページに書いてある生年月日を取得する関数
async function getBirthDay(title) {
  try {
    const url = `https://ja.wikipedia.org/w/api.php?format=json&action=query&origin=*&prop=revisions&rvprop=content&titles=${title}`
    const res = await fetch(url);
    const data = await res.json();
    const key = Object.keys(data.query.pages)[0];
    const text = data.query.pages[key].revisions[0]['*'];
    const birthDayLine = text.match(/(生年月日と年齢.*)|(death_date.*)|(死亡年月日と没年齢.*)|(生年 =.*)/);
    if (birthDayLine[0].includes("生年 =")) {
      const year = text.match(/生年 =.*/)[0].match(/\d{1,4}/);
      const month = text.match(/生月 =.*/)[0].match(/\d{1,2}/);
      const date = text.match(/生日 =.*/)[0].match(/\d{1,2}/);
      if ([year, month, date].includes(null)) return '不明';
      return `${year}年${month}月${date}日`;
    } else if (birthDayLine[0]) {
      const birthDayArr = birthDayLine[0].match(/\d{1,4}/g);
      const [year, month, date] = birthDayArr;
      if ([year, month, date].includes(null)) return '不明';
      return `${year}年${month}月${date}日`;
    } else {
      return "不明"
    }
  } catch (error) {
    return "不明"
  }
}






































































































//特定の文字が入力されていたらあるアラートを表示する関数
function checkInput(text) {
  if (encodeURI(text) === "%E4%B8%AD%E5%9C%92%E5%89%9B%E5%BE%81") {
    alert(decodeURI("%E3%81%9D%E3%82%8C%E3%81%AF%E3%81%82%E3%81%AA%E3%81%9F%E3%81%A7%E3%81%97%E3%82%87%EF%BC%81%0A%E3%82%88%E3%81%8F%E8%A6%8B%E3%81%A4%E3%81%91%E3%82%89%E3%82%8C%E3%81%BE%E3%81%97%E3%81%9F%E3%81%AD%EF%BC%81%0A%E3%82%B3%E3%83%BC%E3%83%89%E3%83%AC%E3%83%93%E3%83%A5%E3%83%BC%E3%81%8A%E7%96%B2%E3%82%8C%E6%A7%98%E3%81%A7%E3%81%99%EF%BC%81%EF%BC%81%EF%BC%81"))
    return true;
  }
}