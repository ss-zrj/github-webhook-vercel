import axios from 'axios';

const FEISHU_WEBHOOK_URL = 'https://open.feishu.cn/open-apis/bot/v2/hook/0663c2bc-a490-43ca-aa4d-54273d001700';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const githubEvent = req.headers['x-github-event']; // 获取 GitHub 事件类型
        const deliveryId = req.headers['x-github-delivery']; // 获取事件唯一标识
        const eventBody = req.body;

        console.log(`Received GitHub event: ${githubEvent} with delivery ID: ${deliveryId}`);

        // 根据事件类型动态生成消息
        const message = generateMessage(githubEvent, eventBody);

        if (!message) {
            return res.status(400).json({ success: false, error: `Unhandled event: ${githubEvent}` });
        }

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

// 动态生成消息模板
function generateMessage(eventType, payload) {
    switch (eventType) {
        case 'issues':
            return formatIssuesMessage(payload);
        case 'issue_comment':
            return formatIssueCommentMessage(payload);
        case 'push':
            return formatPushMessage(payload);
        case 'pull_request':
            return formatPullRequestMessage(payload);
        default:
            return formatGenericMessage(eventType, payload);
    }
}

// Issues 事件模板
function formatIssuesMessage(payload) {
    const { action, issue, repository, sender } = payload;
    return {
        msg_type: 'post',
        content: {
            post: {
                zh_cn: {
                    title: `GitHub Issues 事件通知`,
                    content: [
                        [
                            { tag: 'text', text: `📢 收到 GitHub 事件：Issues (${action})` }
                        ],
                        [
                            { tag: 'text', text: `🔗 仓库：` },
                            { tag: 'a', text: repository.full_name, href: repository.html_url }
                        ],
                        [
                            { tag: 'text', text: `👤 操作用户：${sender.login}` }
                        ],
                        [
                            { tag: 'text', text: `📝 标题：` },
                            { tag: 'a', text: issue.title, href: issue.html_url }
                        ]
                    ]
                }
            }
        }
    };
}

// Issue Comment 事件模板
function formatIssueCommentMessage(payload) {
    const { action, comment, issue, repository, sender } = payload;
    return {
        msg_type: 'post',
        content: {
            post: {
                zh_cn: {
                    title: `GitHub Issue Comment 事件通知`,
                    content: [
                        [
                            { tag: 'text', text: `📢 收到 GitHub 事件：Issue Comment (${action})` }
                        ],
                        [
                            { tag: 'text', text: `🔗 仓库：` },
                            { tag: 'a', text: repository.full_name, href: repository.html_url }
                        ],
                        [
                            { tag: 'text', text: `👤 操作用户：${sender.login}` }
                        ],
                        [
                            { tag: 'text', text: `📝 评论内容：` },
                            { tag: 'text', text: comment.body }
                        ],
                        [
                            { tag: 'text', text: `🔗 Issue：` },
                            { tag: 'a', text: issue.title, href: issue.html_url }
                        ]
                    ]
                }
            }
        }
    };
}

// Push 事件模板
function formatPushMessage(payload) {
    const { pusher, repository, commits, ref } = payload;
    const commitMessages = commits.map(commit => `- ${commit.message} (${commit.url})`).join('\n');

    return {
        msg_type: 'post',
        content: {
            post: {
                zh_cn: {
                    title: `GitHub Push 事件通知`,
                    content: [
                        [
                            { tag: 'text', text: `📢 收到 GitHub 事件：Push` }
                        ],
                        [
                            { tag: 'text', text: `🔗 仓库：` },
                            { tag: 'a', text: repository.full_name, href: repository.html_url }
                        ],
                        [
                            { tag: 'text', text: `👤 推送用户：${pusher.name}` }
                        ],
                        [
                            { tag: 'text', text: `🔀 推送分支：${ref}` }
                        ],
                        [
                            { tag: 'text', text: `📝 提交记录：` },
                            { tag: 'text', text: commitMessages.substring(0, 1000) + '...' }
                        ]
                    ]
                }
            }
        }
    };
}

// Pull Request 事件模板
function formatPullRequestMessage(payload) {
    const { action, pull_request, repository, sender } = payload;
    return {
        msg_type: 'post',
        content: {
            post: {
                zh_cn: {
                    title: `GitHub Pull Request 事件通知`,
                    content: [
                        [
                            { tag: 'text', text: `📢 收到 GitHub 事件：Pull Request (${action})` }
                        ],
                        [
                            { tag: 'text', text: `🔗 仓库：` },
                            { tag: 'a', text: repository.full_name, href: repository.html_url }
                        ],
                        [
                            { tag: 'text', text: `👤 操作用户：${sender.login}` }
                        ],
                        [
                            { tag: 'text', text: `📝 标题：` },
                            { tag: 'a', text: pull_request.title, href: pull_request.html_url }
                        ]
                    ]
                }
            }
        }
    };
}

// 通用事件模板
function formatGenericMessage(eventType, payload) {
    const repository = payload.repository || {};
    const sender = payload.sender || {};

    return {
        msg_type: 'post',
        content: {
            post: {
                zh_cn: {
                    title: `GitHub ${eventType} 事件通知`,
                    content: [
                        [
                            { tag: 'text', text: `📢 收到 GitHub 事件：${eventType}` }
                        ],
                        [
                            { tag: 'text', text: `🔗 仓库：` },
                            { tag: 'a', text: repository.full_name || '未知仓库', href: repository.html_url || '#' }
                        ],
                        [
                            { tag: 'text', text: `👤 操作用户：${sender.login || '未知用户'}` }
                        ],
                        [
                            { tag: 'text', text: `📝 事件详情：` },
                            { tag: 'text', text: JSON.stringify(payload, null, 2).substring(0, 1000) + '...' }
                        ]
                    ]
                }
            }
        }
    };
}