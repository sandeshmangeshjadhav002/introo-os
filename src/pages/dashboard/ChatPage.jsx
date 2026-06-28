import { useState } from 'react'
import { MessageSquare, Send, Plus, Users, Search, MoreVertical, Paperclip, Smile, CheckCircle2 } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Skeleton from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import { useSupabase } from '../../context/SupabaseContext'

export default function ChatPage() {
  const { profile } = useSupabase()
  const [activeChannel, setActiveChannel] = useState(null)
  const [messageInput, setMessageInput] = useState('')
  const [channels] = useState([
    { id: 1, name: 'General', type: 'public', unread: 3 },
    { id: 2, name: 'Sales Team', type: 'public', unread: 0 },
    { id: 3, name: 'Design', type: 'public', unread: 0 },
    { id: 4, name: 'Engineering', type: 'public', unread: 0 },
  ])
  const [directMessages] = useState([
    { id: 1, name: 'John Doe', online: true },
    { id: 2, name: 'Jane Smith', online: false },
  ])
  const [messages] = useState([
    {
      id: 1,
      user: { name: 'John Doe', avatar: 'J' },
      content: 'Hey team, good morning!',
      time: '9:00 AM',
    },
    {
      id: 2,
      user: { name: 'Jane Smith', avatar: 'S' },
      content: 'Good morning! Ready to tackle today\'s tasks.',
      time: '9:01 AM',
    },
  ])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (messageInput.trim()) {
      setMessageInput('')
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Chats</h2>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search channels..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Channels */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Channels</h3>
            <div className="space-y-1">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                    activeChannel?.id === channel.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="flex-1 text-left">{channel.name}</span>
                  {channel.unread > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {channel.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Direct Messages</h3>
            <div className="space-y-1">
              {directMessages.map(user => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      {user.name[0]}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                      user.online ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <span className="flex-1 text-left">{user.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{activeChannel.name}</h3>
                  <p className="text-xs text-gray-500">12 members</p>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div key={message.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {message.user.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{message.user.name}</span>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <button type="button" className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
                    <Smile size={18} />
                  </button>
                </div>
                <Button type="submit" disabled={!messageInput.trim()}>
                  <Send size={18} className="mr-2" />
                  Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a channel"
              description="Choose a channel from the sidebar to start chatting"
            />
          </div>
        )}
      </div>
    </div>
  )
}
