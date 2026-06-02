import Modal from './Modal';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
  title?: string;
}

export default function ErrorModal({ message, onClose, title = 'Terjadi Kesalahan' }: ErrorModalProps) {
  return (
    <Modal isOpen={Boolean(message)} onClose={onClose}>
      <button className="globalModalClose" onClick={onClose} title="Tutup">
        <i className="fas fa-times"></i>
      </button>
      <div className="globalModalIcon" style={{ background: 'var(--badge-red-bg)', color: 'var(--error-red)' }}>
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="globalModalBtns">
        <button
          className="globalModalBtnConfirm"
          style={{ background: 'var(--error-red)', borderColor: 'var(--error-red)' }}
          onClick={onClose}
        >
          Tutup
        </button>
      </div>
    </Modal>
  );
}
