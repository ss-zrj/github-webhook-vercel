import axios from 'axios';

const FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/0663c2bc-a490-43ca-aa4d-54273d001700';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const githubEvent = req.headers['x-github-event']; // 获取 GitHub 事件类型
        const deliveryId = req.headers['x-github-delivery']; // 获取事件唯一标识
        const eventBody = req.body;

        console.log(`Received GitHub event: ${githubEvent} with delivery ID: ${deliveryId}`);

        // 构造通知内容
        const message = {
            msg_type: 'post',
            content: {
                post: {
                    zh_cn: {
                        title: `GitHub ${githubEvent} 事件通知`,
                        content: [
                            [
                                { tag: 'text', text: `📢 收到 GitHub 事件：` },
                                { tag: 'text', text: `${githubEvent}` }
                            ],
                            [
                                { tag: 'text', text: `🔗 仓库：` },
                                { tag: 'a', text: eventBody.repository?.full_name || '未知仓库', href: eventBody.repository?.html_url || '#' }
                            ],
                            [
                                { tag: 'text', text: `👤 操作用户：` },
                                { tag: 'text', text: eventBody.sender?.login || '未知用户' }
                            ],
                            [
                                { tag: 'text', text: `📝 详情：` },
                                { tag: 'text', text: JSON.stringify(eventBody, null, 2).substring(0, 1000) + '...' }
                            ]
                        ]
                    }
                }
            }
        };

        try {
            // 发送到飞书 Webhook
            const response = await axios.post(FEISHU_WEBHOOK_URL, message);
            console.log(`Message sent to Feishu for event ${githubEvent} successfully:`, response.data);

            res.status(200).json({ success: true, message: 'Message sent to Feishu successfully' });
        } catch (error) {
            console.error('Error sending to Feishu:', error.response?.data || error.message);

            res.status(500).json({ success: false, error: 'Failed to send message to Feishu' });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}