import ChatWindow from '../components/organisms/ChatWindow';

export default function AIChat() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-64px)] pb-16 lg:pb-0">
      <ChatWindow />
    </div>
  );
}
