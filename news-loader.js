document.addEventListener('DOMContentLoaded', async () => {
  const newsSection = document.getElementById('news-content');
  if (!newsSection) return;

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
      return;
    }
    
    // 最新の5件のみ表示
    const recentNews = newsFiles.slice(0, 5);
    
    // 各ニュース記事の内容を取得して表示
    const newsPromises = recentNews.map(async (file) => {
      const contentResponse = await fetch(file.download_url);
      if (!contentResponse.ok) return null;
      
      const content = await contentResponse.text();
      
      // マークダウンからメタデータと本文を抽出
      const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      if (!metadataMatch) return null;
      
      const metadataStr = metadataMatch[1];
      const body = metadataMatch[2].trim();
      
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
      
      // ニュース記事のHTMLを生成
      return `
        <div class="news-item mb-6">
          <h3 class="text-xl font-semibold">${metadata.title || 'タイトルなし'}</h3>
          <p class="text-sm text-gray-500">${formattedDate}</p>
          <div class="mt-2">${body}</div>
        </div>
      `;
    });
    
    // すべてのニュース記事を取得して表示
    const newsContents = await Promise.all(newsPromises);
    newsSection.innerHTML = newsContents.filter(Boolean).join('') || '<p>現在、お知らせはありません。</p>';
    
  } catch (error) {
    console.error('ニュース記事の読み込みエラー:', error);
    newsSection.innerHTML = '<p>ニュース記事の読み込み中にエラーが発生しました。</p>';
  }
});
