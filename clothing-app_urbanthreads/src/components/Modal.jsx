export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal">
        {children}
      </div>
    </div>
  )
}
