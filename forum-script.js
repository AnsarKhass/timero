// ===== FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyAd3f4ZRaZ0oWsYKj5XABJtUsshjVcQu64",
  authDomain: "timerun-d6094.firebaseapp.com",
  databaseURL: "https://timerun-d6094-default-rtdb.firebaseio.com",
  projectId: "timerun-d6094",
  storageBucket: "timerun-d6094.firebasestorage.app",
  messagingSenderId: "552931384812",
  appId: "1:552931384812:web:3c802e1247621fe23f34c9",
  measurementId: "G-X5JNCJ6KW3"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// ===== Вкладки =====
const tabHome = document.getElementById('tab-home');
const tabPublish = document.getElementById('tab-publish');
const homeSection = document.getElementById('home-section');
const publishSection = document.getElementById('publish-section');

tabHome.onclick = () => { homeSection.style.display='block'; publishSection.style.display='none'; tabHome.classList.add('active'); tabPublish.classList.remove('active'); };
tabPublish.onclick = () => { homeSection.style.display='none'; publishSection.style.display='block'; tabPublish.classList.add('active'); tabHome.classList.remove('active'); };

// ===== Публикация поста =====
document.getElementById('publishBtn').onclick = async () => {
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const imageFile = document.getElementById('imageInput').files[0];

  if(!title && !content && !imageFile){ alert('Заполните хотя бы одно поле!'); return; }

  const newKey = db.ref('posts').push().key;
  let imageUrl = null;

  if(imageFile){
    try{
      const storageRef = storage.ref(`images/${newKey}_${imageFile.name}`);
      await storageRef.put(imageFile);
      imageUrl = await storageRef.getDownloadURL();
    }catch(err){ console.error(err); alert('Не удалось загрузить фото!'); return; }
  }

  try{
    await db.ref('posts/'+newKey).set({ title, content, image:imageUrl, timestamp:Date.now(), likes:0, comments:{} });
    document.getElementById('title').value='';
    document.getElementById('content').value='';
    document.getElementById('imageInput').value='';
  }catch(err){ console.error(err); alert('Не удалось опубликовать пост!'); }
};

// ===== Рендер постов =====
function renderPosts(postsData){
  const postsDiv = document.getElementById('posts'); postsDiv.innerHTML='';
  if(!postsData) return;

  Object.entries(postsData).sort((a,b)=>b[1].timestamp - a[1].timestamp)
    .forEach(([key, post])=>{
      const div = document.createElement('div'); div.className='post'; div.id='post-'+key;
      div.innerHTML=`
        <h3>${post.title||''}</h3>
        <p>${post.content||''}</p>
        ${post.image?`<img src="${post.image}">`:''}
        <div>
          <button id="like-${key}">👍 ${post.likes||0}</button>
          <button id="toggleComments-${key}">💬 Комменты</button>
        </div>
        <div id="comments-${key}" class="comments" style="display:none;">
          <div id="comments-list-${key}"></div>
          <input type="text" class="comment-input" placeholder="Написать коммент..." id="input-${key}">
        </div>
      `;
      postsDiv.appendChild(div);

      document.getElementById('like-'+key).onclick = () => db.ref('posts/'+key+'/likes').transaction(likes => (likes||0)+1);
      const toggleBtn = document.getElementById('toggleComments-'+key);
      const commentsDiv = document.getElementById('comments-'+key);
      toggleBtn.onclick = () => commentsDiv.style.display = commentsDiv.style.display==='none'?'block':'none';

      const inputField = document.getElementById('input-'+key);
      inputField.onkeydown = e => { if(e.key==='Enter' && inputField.value.trim()!==''){ addComment(key,inputField.value.trim()); inputField.value=''; } };

      const commentsListDiv = document.getElementById('comments-list-'+key);
      db.ref('posts/'+key+'/comments').on('value', snapshot=>{
        const comments = snapshot.val(); commentsListDiv.innerHTML='';
        if(comments) Object.values(comments).sort((a,b)=>a.timestamp-b.timestamp).forEach(c=>{
          const p = document.createElement('p'); p.textContent=c.text; commentsListDiv.appendChild(p);
        });
      });
    });
}

// ===== Добавление комментария =====
function addComment(postKey,text){
  const commentKey = db.ref('posts/'+postKey+'/comments').push().key;
  db.ref(`posts/${postKey}/comments/${commentKey}`).set({ text, timestamp: Date.now() });
}

// ===== Слушаем все посты =====
db.ref('posts').on('value', snapshot => renderPosts(snapshot.val()));
