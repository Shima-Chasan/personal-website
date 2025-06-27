document.addEventListener('DOMContentLoaded', async () => {
  const newsSection = document.getElementById('news-content');
  const viewMoreBtn = document.getElementById('view-more-news');
  const modal = document.getElementById('news-modal');
  const modalContent = document.getElementById('news-modal-content');
  const modalClose = document.getElementById('news-modal-close');
  
  if (!newsSection) return;

  // 全ニュース記事を保存する配列
  let allNewsArticles = [];
  // 現在表示している記事数
  let displayedCount = 0;
  // 一度に表示する記事数
  const articlesPerPage = 3;

  try {
    // GitHubリポジトリからニュース記事を取得
    const repoOwner = 'Shima-Chasan';
    const repoName = 'personal-website';
    const path = 'content/news';
    const branch = 'main';
    
    // GitHubのAPIを使用してコンテンツディレクトリを取得
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}?ref=${branch}`);
    
    if (!response.ok) {
      throw new Error('ニュース記事の取得に失敗しました');
    }
    
    const files = await response.json();
    
    // ニュース記事のファイルをフィルタリング（.mdファイルのみ）
    const newsFiles = files.filter(file => file.name.endsWith('.md'));
    
    if (newsFiles.length === 0) {
      newsSection.innerHTML = '<p>現在、お知らせはありません。</p>';
      if (viewMoreBtn) viewMoreBtn.style.display = 'none';
      return;
    }
    
    // 日付の新しい順にソート（ファイル名から日付を抽出できない場合はAPIの順序を使用）
    newsFiles.sort((a, b) => {
      // ファイル更新日時でソート（新しい順）
      return new Date(b.name) - new Date(a.name);
    });
    
    // 各ニュース記事の内容を取得
    for (const file of newsFiles) {
      const contentResponse = await fetch(file.download_url);
      if (!contentResponse.ok) continue;
      
      const content = await contentResponse.text();
      
      // マークダウンからメタデータと本文を抽出
      const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      if (!metadataMatch) continue;
      
      const metadataStr = metadataMatch[1];
      let body = metadataMatch[2].trim();
      
      // メタデータを解析
      const metadata = {};
      metadataStr.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          metadata[key.trim()] = valueParts.join(':').trim();
        }
      });
      
      // 日付をフォーマット
      const date = metadata.date ? new Date(metadata.date) : new Date();
      const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      
      // 画像パスを抽出（表示しない）
      let imagePath = null;
      const imageMatch = body.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch && imageMatch[1]) {
        imagePath = imageMatch[1].trim();
        // 画像のマークダウン記法を本文から削除
        body = body.replace(imageMatch[0], '');
      }
      
      // 本文を短く切り詰める（プレビュー用）
      const previewText = body.length > 100 ? body.substring(0, 100) + '...' : body;
      
      // 記事オブジェクトを作成
      allNewsArticles.push({
        title: metadata.title || 'タイトルなし',
        date: formattedDate,
        rawDate: date,
        body: body,
        previewText: previewText,
        imagePath: imagePath
      });
    }
    
    // 日付順にソート（新しい順）
    allNewsArticles.sort((a, b) => b.rawDate - a.rawDate);
    
    // 最初のページ分の記事を表示
    displayMoreArticles();
    
    // 「過去のニュースを見る」ボタンのイベントリスナー
    if (viewMoreBtn) {
      if (allNewsArticles.length <= articlesPerPage) {
        viewMoreBtn.style.display = 'none';
      } else {
        viewMoreBtn.addEventListener('click', (e) => {
          e.preventDefault();
          displayMoreArticles();
        });
      }
    }
    
    // モーダルを閉じるボタンのイベントリスナー
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });
    }
    
    // モーダル外クリックで閉じる
    if (modal) {
      window.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
    
  } catch (error) {
    console.error('ニュース記事の読み込みエラー:', error);
    newsSection.innerHTML = '<p>ニュース記事の読み込み中にエラーが発生しました。</p>';
    if (viewMoreBtn) viewMoreBtn.style.display = 'none';
  }
  
  // 記事をさらに表示する関数
  function displayMoreArticles() {
    if (displayedCount >= allNewsArticles.length) {
      if (viewMoreBtn) viewMoreBtn.style.display = 'none';
      return;
    }
    
    const articlesToShow = allNewsArticles.slice(displayedCount, displayedCount + articlesPerPage);
    const articlesHTML = articlesToShow.map((article, index) => {
      const articleId = `news-${displayedCount + index}`;
      return `
        <div class="news-item mb-6 border-b border-gray-200 pb-6 cursor-pointer hover:bg-gray-50 transition p-4 rounded" data-article-id="${articleId}">
          <div class="flex flex-col md:flex-row md:items-center justify-between mb-2">
            <h3 class="text-xl font-semibold text-gray-800">${article.title}</h3>
            <span class="text-sm text-gray-500 mt-1 md:mt-0">${article.date}</span>
          </div>
          <p class="text-gray-600">${article.previewText}</p>
          <p class="text-accent text-sm mt-2">続きを読む...</p>
        </div>
      `;
    }).join('');
    
    if (displayedCount === 0) {
      newsSection.innerHTML = articlesHTML;
    } else {
      newsSection.innerHTML += articlesHTML;
    }
    
    // 記事クリックイベントを追加
    articlesToShow.forEach((article, index) => {
      const articleElement = document.querySelector(`[data-article-id="news-${displayedCount + index}"]`);
      if (articleElement) {
        articleElement.addEventListener('click', () => {
          showArticleModal(article);
        });
      }
    });
    
    displayedCount += articlesPerPage;
    
    // すべての記事を表示したらボタンを非表示
    if (displayedCount >= allNewsArticles.length && viewMoreBtn) {
      viewMoreBtn.style.display = 'none';
    }
  }
  
  // 記事モーダルを表示する関数
  function showArticleModal(article) {
    if (!modal || !modalContent) return;
    
    let imageHTML = '';
    if (article.imagePath) {
      imageHTML = `
        <div class="mb-6">
          <img src="${article.imagePath}" alt="${article.title}の画像" class="max-w-full h-auto rounded">
        </div>
      `;
    }
    
    modalContent.innerHTML = `
      <h2 class="text-2xl font-bold mb-2">${article.title}</h2>
      <p class="text-gray-500 mb-4">${article.date}</p>
      ${imageHTML}
      <div class="prose">
        ${article.body}
      </div>
    `;
    
    modal.style.display = 'flex';
  }
});
