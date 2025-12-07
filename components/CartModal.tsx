import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Send } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  whatsappNumber: string;
}

const CartModal: React.FC<CartModalProps> = ({ 
  isOpen, 
  onClose, 
  cart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  whatsappNumber
}) => {
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  if (!isOpen) return null;

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (!customerName) {
      alert("Por favor, digite seu nome.");
      return;
    }

    let message = `*Novo Pedido - Várzea Alegre FC*\n\n`;
    message += `*Cliente:* ${customerName}\n`;
    if (tableNumber) message += `*Mesa:* ${tableNumber}\n`;
    message += `---------------------------\n`;

    cart.forEach(item => {
      message += `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });

    message += `---------------------------\n`;
    message += `*Total: R$ ${total.toFixed(2)}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    clearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-green-700 p-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">Seu Pedido</h2>
          <button onClick={onClose} className="hover:bg-green-600 p-1 rounded-full"><X size={24} /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Seu carrinho está vazio.
              <br />Adicione alguns itens deliciosos!
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-green-700 font-bold">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-md">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      >-</button>
                      <span className="px-2 text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      >+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Seu Nome</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ex: João da Silva"
              />
              <label className="block text-sm font-medium text-gray-700">Mesa (Opcional)</label>
              <input 
                type="text" 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ex: 05"
              />
            </div>
            
            <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <Send size={20} />
              Enviar Pedido via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;