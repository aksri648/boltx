import { useParams } from 'react-router-dom';
import IndexPage from './IndexPage';

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();

  return <IndexPage />;
}
