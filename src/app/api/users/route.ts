import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  // GET endpoint kod kommer leva här
};

// Skapa användare i databasen. "Kommer använda bcrypt för att kryptera lösenorden som sänds i request body" Nope haha. Se kommentar i working-log.md
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // En User i vår databas vill ha role_id, email, password (se kommentar i working-log.md), och username
    // Vår Postgres instance tar hand om id och created_at
    // fname, lname, street, city etc etc fylls antingen i av användare via UI i antingen /profile eller i och med checkout tänker jag
    let { role_id, email, password, username } = body;

    if (!role_id || !email || !password || !username) {
      return NextResponse.json({ error: "Missing required User fields" }, { status: 400 });
    }
    console.log(`Received the following User payload: role_id: ${role_id}, email: ${email}, password: ${password}, username: ${username}`); // Once again med lösenordet; vi skulle ALDRIG göra så här i produktion för ett riktigt projekt haha

    // Input data validation
    // Jag tänker att:
    // * email får en mega simpel validation rule i att den endast måste innehålla en "@"
    // * lösen måste vara minst 8 karaktärer
    // * användarnamn måste vara minst 3 karaktärer
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes("@")) {
      return NextResponse.json({ error: "Must use a valid email address" }, { status: 400 });
    }
    
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 8) {
      return NextResponse.json({ error: "Password cannot be less than 8 characters" }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return NextResponse.json({ error: "Username cannot be less than 3 characters" }, { status: 400 });
    }

    const query = {
      name: "insert-new-user",
      text: `
      INSERT INTO "User" (role_id, email, password, username)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      values: [role_id, trimmedEmail, trimmedPassword, trimmedUsername] // Lättar lite på säkerheten men vi använder fortfarande parameterized queries!  
    }

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (err) {
    console.error("Unexpected error creating user:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Du måste vara inloggad' }, { status: 401 });
    }

    const { fname, lname, street, city, postalCode, country } = await req.json();

    const clean = (value: unknown) =>
      typeof value === 'string' && value.trim() !== '' ? value.trim() : null;

    const query = {
      name: 'update-user-profile',
      text: `
        UPDATE "User"
        SET fname = $1, lname = $2, street = $3, city = $4, postal_code = $5, country = $6
        WHERE id = $7
        RETURNING id, fname, lname, street, city, postal_code, country
      `,
      values: [
        clean(fname), clean(lname), clean(street),
        clean(city), clean(postalCode), clean(country),
        user.id,
      ],
    };

    const res = await pool.query(query);
    return NextResponse.json({ success: 'ok', data: res.rows[0] });
  } catch (err) {
    console.error('Kunde inte uppdatera profilen:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
