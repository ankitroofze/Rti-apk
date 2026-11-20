import { AuthAPI } from '../auth/ClientAPI/AuthApi';

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Push / inbox notification -> sahi screen.
 * `data` = push ka data object (values strings hote hain) ya inbox item ({ type, news_id, ... }).
 */
export async function navigateFromNotification(navigation, data = {}) {
  if (!navigation?.navigate || !data) return;
  const type = String(data?.type || '').trim();

  try {
    switch (type) {
      case 'news':
      case 'breaking_news':
      case 'article':
      case 'new_comment':
      case 'comment_reply':
      case 'news_liked':
      case 'news_status': {
        const id = num(data.news_id || data.article_id || data.id);
        if (!id) return navigation.navigate('Notifications');
        let article = { id };
        try {
          const res = await AuthAPI.getNewsById(id);
          if (res?.ok && res.news) article = { ...res.news, id };
        } catch {}
        return navigation.navigate('NewsDetails', { article });
      }
      case 'new_follower': {
        const userId = num(data.user_id);
        return userId ? navigation.navigate('UserPublicProfile', { userId }) : navigation.navigate('Notifications');
      }
      case 'ecom_enquiry':
        return navigation.navigate('SellerEnquiryDashboard');
      case 'id_card_status':
      case 'profile_review':
        return navigation.navigate('Profile');
      case 'withdrawal_status':
        return navigation.navigate('Wallet');
      case 'lead_form_submission':
        return navigation.navigate('AdLeadResponse', { submissionId: data.submission_id, adId: data.ad_id });
      default: {
        const fallbackNewsId = num(data.news_id || data.article_id);
        if (fallbackNewsId) {
          let article = { id: fallbackNewsId };
          try {
            const res = await AuthAPI.getNewsById(fallbackNewsId);
            if (res?.ok && res.news) article = { ...res.news, id: fallbackNewsId };
          } catch {}
          return navigation.navigate('NewsDetails', { article });
        }
        return navigation.navigate('Notifications');
      }
    }
  } catch {
    // navigation fail ho to app crash nahi hona chahiye
  }
}
