const EDGE_FUNCTION_URL = 'https://xucmespxytzbyvfzpdoc.supabase.co/functions/v1/wechat-login';

Page({
  data: {
    uuid: '',
    status: 'idle',
    errorMsg: '',
  },

  onLoad(options) {
    const uuid = options.uuid || '';
    if (!uuid) {
      this.setData({ status: 'error', errorMsg: 'Missing login session' });
      return;
    }
    this.setData({ uuid });
  },

  handleLogin() {
    if (this.data.status === 'loading') return;
    this.setData({ status: 'loading', errorMsg: '' });

    wx.login({
      success: (res) => {
        if (!res.code) {
          this.setData({ status: 'error', errorMsg: 'Failed to get WeChat code' });
          return;
        }
        wx.request({
          url: EDGE_FUNCTION_URL,
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: res.code, uuid: this.data.uuid },
          timeout: 10000,
          success: (resp) => {
            if (resp.data && resp.data.success) {
              this.setData({ status: 'success' });
            } else {
              this.setData({
                status: 'error',
                errorMsg: (resp.data && resp.data.error) || 'Login failed',
              });
            }
          },
          fail: () => {
            this.setData({ status: 'error', errorMsg: 'Network error, please retry' });
          },
        });
      },
      fail: () => {
        this.setData({ status: 'error', errorMsg: 'WeChat login failed' });
      },
    });
  },
});
