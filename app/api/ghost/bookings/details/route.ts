import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("auth_token")?.value;
    const bookingNumber = cookieStore.get("bookingNumber")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 }
      );
    }

    if (!bookingNumber) {
      return NextResponse.json(
        { error: "BookingNumber no encontrado" },
        { status: 400 }
      );
    }

    const response = await axios.get(
      `https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/bookings/${bookingNumber}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": `Bearer ${token}`,
        },
      }
    );

    const booking = response.data;

    // ⬇️ Devuelve SOLO lo que usarás en el dialog
    return NextResponse.json({
      id: booking.id,
      passengerName: booking.name,
      phone: booking.telephoneNumber,
      pickupTime: booking.pickupDueTime,
      pickupAddress: booking.pickup.address.text,
      destinationAddress: booking.destination.address.text,
      passengers: booking.passengers,
      price: booking.pricing?.price,
      paymentMethod: booking.paymentMethod,
      vehicle: booking.pricing?.pricingTariff,
      status: booking.advancedBooking?.status,
    });
  } catch (err: any) {
    console.error(
      "Error obteniendo booking:",
      err.response?.data || err.message
    );

    return NextResponse.json(
      { error: "Error obteniendo booking" },
      { status: 500 }
    );
  }
}
