export interface Email {
  id: string;
  asunto: string;
  remitente: string;
  fecha: string;
  contenido: string;
}

export const emailEjemplo: Email = {
  id: "1",
  asunto: "Reserva confirmada - Hotel Marina Bay",
  remitente: "reservas@hotelmarina.com",
  fecha: "3 de Diciembre, 2024 • 14:32",
  contenido: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <p>¡Hola,</p>
      
      <p>Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2c3e50;">Detalles de la Reserva</h3>
        <p><strong>Hotel:</strong> Hotel Marina Bay Resort & Spa</p>
        <p><strong>Tipo de Habitación:</strong> Suite Deluxe con Vista al Mar</p>
        <p><strong>Check-in:</strong> 15 de Diciembre, 2024</p>
        <p><strong>Check-out:</strong> 18 de Diciembre, 2024</p>
        <p><strong>Número de Noches:</strong> 3</p>
        <p><strong>Precio por Noche:</strong> $250 USD</p>
        <p><strong>Total:</strong> $750 USD</p>
        <p><strong>Número de Reserva:</strong> MBA-2024-789456</p>
      </div>
      
      <p>Tu número de confirmación es <strong>MBA-2024-789456</strong>. Por favor guárdalo para futuras referencias.</p>
      
      <p>Si tienes alguna pregunta o necesitas hacer cambios, no dudes en contactarnos.</p>
      
      <p>¡Te deseamos una estancia maravillosa!</p>
      
      <p>Cordialmente,<br/>
      Equipo de Reservas<br/>
      Hotel Marina Bay Resort & Spa</p>
    </div>
  `,
};
