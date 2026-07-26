import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocketContext } from '../context/SocketContext.jsx';
import Loader from '../components/Loader.jsx';
import RatingStars from '../components/RatingStars.jsx';

export default function TransactionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinTransactionRoom } = useSocketContext();
  const [txn, setTxn] = useState(null);
  const [contacts, setContacts] = useState(null);
  const [meetupPoints, setMeetupPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingDone, setRatingDone] = useState(false);
  const bottomRef = useRef(null);

  function load() {
    api.get('/transactions/mine').then((res) => {
      const found = res.data.transactions.find((t) => t._id === id);
      setTxn(found);
      setLoading(false);
    });
  }

  useEffect(load, [id]);

  useEffect(() => {
    if (txn && ['accepted', 'completed'].includes(txn.status) && socket) {
      joinTransactionRoom(id);
      
      const onConnect = () => joinTransactionRoom(id);
      socket.on('connect', onConnect);

      api.get(`/messages/${id}`).then((res) => setMessages(res.data.messages)).catch(() => {});

      return () => {
        socket.off('connect', onConnect);
      };
    }
  }, [txn?.status, socket, id]);

  useEffect(() => {
    if (!socket) return;
    function onNew(msg) {
      const txnId = typeof msg.transaction === 'object' ? msg.transaction._id : msg.transaction;
      if (String(txnId) === String(id)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
      }
    }
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [socket, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (txn?.status === 'pending' && isOwnerView()) {
      navigator.geolocation?.getCurrentPosition((pos) => {
        api.get('/meetup-points', { params: { near: `${pos.coords.latitude},${pos.coords.longitude}` } })
          .then((res) => setMeetupPoints(res.data.points));
      });
    }
  }, [txn?.status]);

  function isOwnerView() {
    return txn && user._id === txn.owner?._id;
  }

  async function accept() {
    setError('');
    const point = meetupPoints.find((p) => p._id === selectedPoint);
    try {
      const { data } = await api.patch(`/transactions/${id}/accept`, {
        meetupPointName: point?.name,
        meetupCoordinates: point?.location?.coordinates,
      });
      setTxn((t) => ({ ...t, status: 'accepted', meetupPoint: data.transaction.meetupPoint }));
      setContacts(data.contacts);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not accept request');
    }
  }

  async function decline() {
    try {
      await api.patch(`/transactions/${id}/decline`);
      setTxn((t) => ({ ...t, status: 'declined' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not decline request');
    }
  }

  async function complete() {
    try {
      const { data } = await api.patch(`/transactions/${id}/complete`);
      setTxn((t) => ({ ...t, status: data.transaction.status, completionConfirmedBy: data.transaction.completionConfirmedBy }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not mark complete');
    }
  }

  async function noShow() {
    try {
      await api.patch(`/transactions/${id}/no-show`);
      setTxn((t) => ({ ...t, status: 'no_show' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not report no-show');
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/messages/${id}`, { text });
      setMessages((prev) => {
        if (prev.some((m) => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
      setText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send message');
    }
  }

  async function submitRating() {
    try {
      await api.post('/ratings', { transactionId: id, stars: ratingStars, comment: ratingComment });
      setRatingDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit rating');
    }
  }

  if (loading) return <Loader />;
  if (!txn) return <p className="text-center py-16 text-muted">Transaction not found.</p>;

  const myConfirmed = txn.completionConfirmedBy?.some((cid) => (cid._id || cid) === user._id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-1">{txn.listing?.title}</h1>
      <p className="text-muted mb-6">Status: <span className="font-medium text-ink">{txn.status.replace('_', ' ')}</span></p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {txn.status === 'pending' && isOwnerView() && (
        <div className="bg-card border border-ink/10 rounded-xl p-5 mb-6 space-y-3">
          <p className="font-medium">{txn.requester?.name} wants this item. Accept to share contact details and a safe meetup point.</p>
          <div>
            <label className="text-sm font-medium block mb-1">Choose a pre-approved public meetup point</label>
            <select value={selectedPoint} onChange={(e) => setSelectedPoint(e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2">
              <option value="">Select a location…</option>
              {meetupPoints.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.locality})</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={accept} className="bg-forest text-white font-medium px-5 py-2 rounded-full hover:bg-forest-dark">Accept</button>
            <button onClick={decline} className="border border-ink/20 font-medium px-5 py-2 rounded-full hover:bg-sage/50">Decline</button>
          </div>
        </div>
      )}

      {txn.status === 'pending' && !isOwnerView() && (
        <p className="bg-amber/10 text-amber-dark rounded-lg px-4 py-3">Waiting for the owner to accept your request. Contact details will unlock once they do.</p>
      )}

      {['accepted', 'completed'].includes(txn.status) && (
        <div className="bg-card border border-ink/10 rounded-xl p-5 mb-6 space-y-2">
          <p className="font-semibold">Contact & meetup details</p>
          {contacts ? (
            <>
              <p className="text-sm">Requester: {contacts.requester.name} · {contacts.requester.phone || contacts.requester.email}</p>
              <p className="text-sm">Owner: {contacts.owner.name} · {contacts.owner.phone || contacts.owner.email}</p>
            </>
          ) : (
            <p className="text-sm text-muted">Contact details were shared at acceptance — check your notifications/email.</p>
          )}
          {txn.meetupPoint?.name && <p className="text-sm">📍 Meetup point: {txn.meetupPoint.name}</p>}
          <p className="text-xs text-muted">Meet in daylight, in a public place, and inspect the item before paying. See our Safety Guidelines page.</p>
        </div>
      )}

      {txn.status === 'accepted' && (
        <>
          <div className="border border-ink/10 rounded-xl p-4 mb-6 bg-card">
            <p className="font-semibold mb-3">Chat</p>
            <div className="h-56 overflow-y-auto space-y-2 mb-3 pr-1">
              {messages.map((m) => (
                <div key={m._id} className={`text-sm max-w-[80%] px-3 py-2 rounded-xl ${m.sender._id === user._id ? 'bg-forest text-white ml-auto' : 'bg-sage/50'}`}>
                  <p>{m.text}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" className="flex-1 border border-ink/20 rounded-full px-4 py-2 text-sm" />
              <button className="bg-forest text-white px-4 py-2 rounded-full text-sm font-medium">Send</button>
            </form>
          </div>

          <div className="flex gap-3">
            <button onClick={complete} disabled={myConfirmed} className="bg-forest text-white font-medium px-5 py-2 rounded-full hover:bg-forest-dark disabled:opacity-50">
              {myConfirmed ? 'Waiting for other party…' : 'Mark completed'}
            </button>
            <button onClick={noShow} className="border border-red-300 text-red-500 font-medium px-5 py-2 rounded-full hover:bg-red-50">
              Report no-show
            </button>
          </div>
        </>
      )}

      {txn.status === 'completed' && !ratingDone && (
        <div className="bg-card border border-ink/10 rounded-xl p-5">
          <p className="font-semibold mb-2">Rate the other party</p>
          <RatingStars value={ratingStars} onChange={setRatingStars} size="text-2xl" />
          <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Optional comment…" rows={3} className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm mt-3" />
          <button onClick={submitRating} className="mt-3 bg-forest text-white font-medium px-5 py-2 rounded-full hover:bg-forest-dark">Submit rating</button>
        </div>
      )}
      {(txn.status === 'completed' && ratingDone) && (
        <p className="text-forest bg-forest/10 rounded-lg px-4 py-3">Thanks for rating! This helps keep ShareShelf trustworthy.</p>
      )}

      {txn.status === 'declined' && <p className="text-muted bg-ink/5 rounded-lg px-4 py-3">This request was declined.</p>}
      {txn.status === 'no_show' && <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3">A no-show was reported for this meetup. It's been logged and factors into ratings/flags.</p>}
    </div>
  );
}
