// const axios = require('axios');
import axios from 'axios';
const FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/0663c2bc-a490-43ca-aa4d-54273d001700';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const githubEvent = req.headers['x-github-event'];
        if (githubEvent === 'issues') {
            const { action, issue, repository, sender } = req.body;

            const message = {
                msg_type: 'post',
                content: {
                    post: {
                        zh_cn: {
                            title: 'GitHub Issue 通知',
                            content: [
                                [
                                    { tag: 'text', text: `👤 ${sender.login} 在仓库 ` },
                                    { tag: 'text', text: `[${repository.full_name}] ` },
                                    { tag: 'text', text: `${action} 了一个 Issue：` }
                                ],
                                [
                                    { tag: 'a', text: `${issue.title}`, href: issue.html_url }
                                ]
                            ]
                        }
                    }
                }
            };

            try {
                const response = await axios.post(FEISHU_WEBHOOK_URL, message);
                res.status(200).json({ success: true, message: 'Message sent to Feishu successfully' });
            } catch (error) {
                console.error('Error sending to Feishu:', error.response?.data || error.message);
                res.status(500).json({ success: false, error: 'Failed to send message to Feishu' });
            }
        } else {
            res.status(400).json({ success: false, error: 'Unhandled event' });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}

