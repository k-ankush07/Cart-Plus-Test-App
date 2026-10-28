export const LIBRARY_TEMPLATES = [
  {
    id: "happy-customers",
    title: "Happy Customers",
    category: "social-proof",
    type: "html",
    code: `<style>
  .containerAb7xF3 {
    display: flex;
    align-items: center;
    background: linear-gradient(90deg, #b29eff, #d39fff);
    padding: 5px 15px;
    border-radius: 6px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    color: white;
    font-weight: bold;
    width: fit-content;
    margin: 10px auto;
  }
  .avatarsWrapper9JuY2 { display: flex; margin-right: 10px; }
  .avatarImgS3k8Ly {
    width: 24px; height: 24px; border-radius: 16px;
    border: 2px solid white; margin-left: -8px;
  }
  .avatarImgS3k8Ly:first-child { margin-left: 0; }
</style>
<div class="containerAb7xF3">
  <div class="avatarsWrapper9JuY2">
    <img src="https://cart.tryrapi.com/library/avatars/female-08.jpg" alt="Customer 1" class="avatarImgS3k8Ly">
    <img src="https://cart.tryrapi.com/library/avatars/male-06.jpg" alt="Customer 2" class="avatarImgS3k8Ly">
    <img src="https://cart.tryrapi.com/library/avatars/female-09.jpg" alt="Customer 3" class="avatarImgS3k8Ly">
  </div>
  <span>1,000,000+ HAPPY CUSTOMERS</span>
</div>`,
  },
  {
    id: "Scrolling Reviews",
    title: "Scrolling Reviews",
    category: "social-proof",
    type: "html",
    code: `
      <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body.unique-body-vB79Q1 {
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f8f4f1;
    }

    /* Başlık Stili */
    .unique-title-Yp8T4 {
      font-size: 18px;
      font-weight: bold;
      color: #0d0d0d;
      margin-bottom: 15px;
      text-align: center;
    }

    .unique-title-Yp8T4 span {
      font-family: 'Dancing Script', cursive; /* El yazısı fontu */
      font-size: 36px; /* Daha büyük font boyutu */
      background: linear-gradient(90deg, #32CD32, #006400); /* Daha modern gradyan yeşil */
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: bold;
    }

    .unique-container-Xr4D2a {
      width: 100%;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin: 10px auto;
    }

    .unique-slider-Rc9G7h {
      display: flex;
      gap: 20px;
      animation: scrollAnimation-8Tm5Yp 30s linear infinite;
    }

    .unique-card-Lj6Z8k {
      background-color: #fff;
      border-radius: 25px;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
      padding: 15px 20px;
      display: flex;
      align-items: center;
      margin: 10px 0;
      white-space: nowrap;
      min-width: max-content;
      box-sizing: border-box;
    }

    .unique-image-Ys3Kv9 {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 15px;
      box-shadow: 0 0 0 2px #fff, 0 0 0 4px #f4b400;
    }

    @keyframes scrollAnimation-8Tm5Yp {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-100%);
      }
    }

    /* Mobil versiyon için animasyon daha hızlı */
    @media (max-width: 768px) {
      .unique-slider-Rc9G7h {
        animation: scrollAnimation-8Tm5Yp 15s linear infinite; /* Daha hızlı */
      }
    }

    /* Scroll Animation for the second row, in opposite direction */
    .unique-slider-Rc9G7h:nth-child(2) {
      animation-direction: reverse;
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">

<!-- Başlık -->
<h1 class="unique-title-Yp8T4">Our customers <span>love</span> the product</h1>

<div class="unique-container-Xr4D2a">
  <!-- Row 1 -->
  <div class="unique-slider-Rc9G7h">
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-01.jpg" alt="User Image">
      <p>The perfect fall slippers!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/male-02.jpg" alt="User Image">
      <p>My new favorite pair of shoes!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-03.jpg" alt="User Image">
      <p>A MUST buy for fall!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/male-03.jpg" alt="User Image">
      <p>10/10 Worth every penny</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-04.jpg" alt="User Image">
      <p>I absolutely am in love with the slippers! I wear them everywhere!</p>
    </div>

    <!-- Duplicate Row 1 for Smooth Loop -->
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-01.jpg" alt="User Image">
      <p>The perfect fall slippers!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/male-02.jpg" alt="User Image">
      <p>My new favorite pair of shoes!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-03.jpg" alt="User Image">
      <p>A MUST buy for fall!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/male-03.jpg" alt="User Image">
      <p>10/10 Worth every penny</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-04.jpg" alt="User Image">
      <p>I absolutely am in love with the slippers! I wear them everywhere!</p>
    </div>
  </div>

  <!-- Row 2 (Opposite Direction) -->
  <div class="unique-slider-Rc9G7h">
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-05.jpg" alt="User Image">
      <p>Comfy. Can't think of a better autumn shoe!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/male-04.jpg" alt="User Image">
      <p>OMG! Best autumn shoe!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-06.jpg" alt="User Image">
      <p>Perfect for chilly days!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/male-05.jpg" alt="User Image">
      <p>Amazing quality and comfort!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-07.jpg" alt="User Image">
      <p>Stylish and super comfy!</p>
    </div>

    <!-- Duplicate Row 2 for Smooth Loop -->
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-05.jpg" alt="User Image">
      <p>Comfy. Can't think of a better autumn shoe!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/male-04.jpg" alt="User Image">
      <p>OMG! Best autumn shoe!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-06.jpg" alt="User Image">
      <p>Perfect for chilly days!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/male-05.jpg" alt="User Image">
      <p>Amazing quality and comfort!</p>
    </div>
    <div class="unique-card-Lj6Z8k">
      <img class="unique-image-Ys3Kv9" src="https://cart.tryrapi.com/library/avatars/female-07.jpg" alt="User Image">
      <p>Stylish and super comfy!</p>
    </div>
  </div>
</div>
`,
  },
  {
    id: "Trustpilot Comments",
    title: "Trustpilot Comments",
    category: "reviews",
    type: "html",
    code: `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body.FgVdQeK8P7 {
            font-family: Arial, sans-serif;
            background-color: #f5fdf5;
            margin: 0;
            padding: 0;
        }

        h1.d3FsH6IqT4 {
            margin-top: 30px;
            font-size: 26px;
            font-weight: bold;
            color: #333;
            text-align: center;
        }

        h1 .AaB2Y5Gp9f {
            background: linear-gradient(to bottom, #28a745 0%, #d3f9d8 100%);
            -webkit-background-clip: text;
            color: transparent;
        }

        p.RwV2N5Lt0I {
            margin-top: 5px;
            font-size: 16px;
            color: #555;
            text-align: center;
        }

        .LaVtZ1Q0xK {
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
            margin-top: 10px;
        }

        .KsF9M8H2Ej {
            display: flex;
            align-items: center;
            margin-right: 10px;
        }

        .KsF9M8H2Ej svg {
            width: 18px;
            height: 18px;
            fill: #28a745;
            margin: 0 1px;
        }

        .jX4N5P7Dr6 {
            font-weight: normal;
        }

        .Yk4V8N6Vf1 {
            font-weight: bold;
        }

        .zT8B3S1VgD {
            font-weight: normal;
            margin-left: 5px;
        }

        .F0rW6K8yEz {
            display: flex;
            flex-wrap: nowrap;
            gap: 20px;
            overflow-x: scroll;
            padding: 20px;
            margin: 20px auto;
            width: 90%;
            box-sizing: border-box;
        }

        .nQ0V3S1vD7 {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: left;
            position: relative;
            border-left: 4px solid #28a745;
            width: 400px;
            flex-shrink: 0;
        }

        .nQ0V3S1vD7 .Fb0W9T8TjZ {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 14px;
            color: #333;
        }

        .nQ0V3S1vD7 .rT9B3G2MdF {
            font-size: 12px;
            color: #777;
            margin-bottom: 15px;
        }

        .nQ0V3S1vD7 .gP9Z3A2Kn7 {
            font-size: 14px;
            color: #555;
            margin-bottom: 15px;
            line-height: 1.6;
        }

        .nQ0V3S1vD7 .Vh3J2R4Nw1 {
            font-size: 12px;
            color: #28a745;
            font-weight: bold;
        }

        .nQ0V3S1vD7 .Bz5W3F7Wz2 {
            margin-top: 10px;
        }

        .Bz5W3F7Wz2 svg {
            width: 16px;
            height: 16px;
            fill: #28a745;
        }

        .iX7Q3H6Fv4 {
            font-size: 14px;
            margin-top: 20px;
            color: #555;
            text-align: center;
        }

        .iX7Q3H6Fv4 span {
            background-color: #28a745;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
        }

        /* Scrollbar styling for horizontal scrolling */
        .F0rW6K8yEz::-webkit-scrollbar {
            height: 8px;
        }

        .F0rW6K8yEz::-webkit-scrollbar-thumb {
            background-color: #28a745;
            border-radius: 10px;
        }

        .F0rW6K8yEz::-webkit-scrollbar-track {
            background-color: #f5fdf5;
        }

        /* Green gradient at the bottom with fading upwards */
        .iX7Q3H6Fv4 {
            background: linear-gradient(to top, #d3f9d8 0%, #e1f7e0 60%, #f5fdf5 100%);
            padding: 20px;
            text-align: center;
        }
    </style>
    <h1 class="d3FsH6IqT4">Your <span class="AaB2Y5Gp9f">satisfaction</span> is our success</h1>
    <p class="RwV2N5Lt0I">We value your feedback</p>

    <div class="LaVtZ1Q0xK">
        <div class="KsF9M8H2Ej" aria-label="5 out of 5 stars">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
        </div>
        <div class="jX4N5P7Dr6">
            Trustscore <span class="Yk4V8N6Vf1">4.9 | 14,500+</span> reviews
        </div>
    </div>

    <div class="F0rW6K8yEz">
        <div class="nQ0V3S1vD7">
            <div class="Fb0W9T8TjZ">Julia M.</div>
            <div class="rT9B3G2MdF">Just now</div>
            <div class="gP9Z3A2Kn7">"Before, I struggled to balance work and workouts. With this reformer, I can quickly exercise at home after work. In just a few weeks, my core strength and posture improved dramatically."</div>
            <div class="Vh3J2R4Nw1">✔ Verified Review</div>
            <div class="Bz5W3F7Wz2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
            </div>
        </div>

        <div class="nQ0V3S1vD7">
            <div class="Fb0W9T8TjZ">Michaela R.</div>
            <div class="rT9B3G2MdF">2 hours ago</div>
            <div class="gP9Z3A2Kn7">"Thanks to the reformer, I can work out while my baby sleeps. In just 10 days, I lost 3 kg and feel stronger and more energetic thanks to regular training."</div>
            <div class="Vh3J2R4Nw1">✔ Verified Review</div>
            <div class="Bz5W3F7Wz2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
            </div>
        </div>

        <div class="nQ0V3S1vD7">
            <div class="Fb0W9T8TjZ">Anissa T.</div>
            <div class="rT9B3G2MdF">1 week ago</div>
            <div class="gP9Z3A2Kn7">"Before getting the mobile Pilates reformer in early 2024, my workouts were irregular. Now, I can train at home anytime and have seen improvements in strength, flexibility, and muscle tone within a few weeks."</div>
            <div class="Vh3J2R4Nw1">✔ Verified Review</div>
            <div class="Bz5W3F7Wz2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
            </div>
        </div>

        <!-- New review cards -->
        <div class="nQ0V3S1vD7">
            <div class="Fb0W9T8TjZ">Sophia A.</div>
            <div class="rT9B3G2MdF">3 hours ago</div>
            <div class="gP9Z3A2Kn7">"Previously, I spent a fortune on Pilates classes, some costing up to 100 euros. The new FitCore reformer cost less than one class and gives me the freedom to plan my workouts from home."</div>
            <div class="Vh3J2R4Nw1">✔ Verified Review</div>
            <div class="Bz5W3F7Wz2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/></svg>
            </div>
        </div>

    </div>

    <div class="iX7Q3H6Fv4">Based on <span>76,900</span> verified reviews</div>`,
  },
  {
    id: "heart-review-icons",
    title: "Heart Review Icons",
    category: "reviews",
    type: "html",
    code: `<style>
:root {
  --social-proof-text-color: #000000;
  --social-proof-heart-color: #E24343;
}
.social-proof-slide__block-rating {
    display: flex; align-items: center; justify-content: flex-start;
    font-size: 14px; width: fit-content; margin: 10px auto;
}
.social-proof-slide__block-hearts {
    display: flex; margin-right: 8px; color: var(--social-proof-heart-color);
}
.social-proof-slide__block-rating-text {
    display: inline; color: var(--social-proof-text-color);
}
.social-proof-heart {
    margin: 0; padding: 0; display: flex;
    justify-content: center; align-items: center;
    width: 16px; height: 16px;
}
.social-proof-heart svg {
    width: 16px; height: 16px; fill: var(--social-proof-heart-color);
}
</style>
<div class="social-proof-slide__block-rating">
  <span class="social-proof-slide__block-hearts">
    ${Array(5).fill(`<span class="social-proof-heart"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg></span>`).join("")}
  </span>
  <span class="social-proof-slide__block-rating-text">
    Loved 4.8 by 1500+ Customers!
  </span>
</div>`,
  },
  {
    id: "loved-by-10000",
    title: "Loved by 10,000+ (Red)",
    category: "social-proof",
    type: "html",
    code: `<div class="loved-by-customers">
<span>❤️  Loved by 10,000 Customers</span>
</div>
<style>
  .loved-by-customers {
    background: #FFD1D1;
    color: #A71E1E;
    text-align: center;
    padding: 6px;
    margin-top: 20px;
    border-radius: 20px;
    width: 300px;
    margin-left: auto;
    margin-right: auto;
    font-size: 14px;
  }
</style>`,
  },
  {
    id: "rating-stars",
    title: "Rating Stars",
    category: "reviews",
    type: "html",
    code: `<style>
  .unique-rating-container-Wsx456 {
    display: flex; align-items: center; font-size: 14px;
    color: #333; width: fit-content; margin: 10px auto;
  }
  .unique-rating-stars-Edc789 { display: flex; margin-right: 8px; }
  .unique-rating-stars-Edc789 svg {
    fill: #FFD700; width: 16px; height: 16px;
    transition: transform 0.3s;
  }
  .unique-rating-stars-Edc789 svg:hover { transform: scale(1.3); }
  .unique-rating-text-Rfv012 { font-size: 14px; color: #333; }
</style>
<div class="unique-rating-container-Wsx456">
  <div class="unique-rating-stars-Edc789">
    ${Array(5).fill(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431 8.144 1.18-5.906 5.434 1.391 8.079L12 18.896l-7.297 3.843 1.391-8.079-5.906-5.434 8.144-1.18z"/></svg>`).join("")}
  </div>
  <span class="unique-rating-text-Rfv012">Rated 4.8/5 by 1500+ Customers!</span>
</div>`,
  },
  {
    id: "reviews-count",
    title: "Reviews",
    category: "reviews",
    type: "html",
    code: `<style>
    .unique-review-container-Abc {
        display: flex; align-items: center; gap: 8px;
        font-size: 12px; width: fit-content; margin: 10px auto;
    }
    .unique-review-count-Def, .unique-review-rating-Ghi, .unique-verified-purchase-Jkl {
        display: flex; align-items: center;
    }
    .unique-review-count-Def { color: #333; }
    .unique-review-rating-Ghi { font-weight: bold; color: #333; }
    .unique-verified-purchase-Jkl {
        display: flex; align-items: center;
        background-color: #f0fff0; padding: 2px 4px;
        border-radius: 3px; color: #333;
    }
    .unique-verified-purchase-Jkl::before {
        content: "✓"; color: #00a000; margin-right: 3px;
    }
</style>
<div class="unique-review-container-Abc">
    <div class="unique-review-count-Def">1,661 reviews</div>
    <div class="unique-review-rating-Ghi">| 4.7</div>
    <div class="unique-verified-purchase-Jkl">
        <span>All reviews are from verified purchases</span>
    </div>
</div>`,
  },
  {
    id: "rated-4-5",
    title: "Rated 4.5/5",
    category: "reviews",
    type: "html",
    code: `<style>
    .rating-widget-123 {
        display: flex; align-items: center;
        width: fit-content; margin: 10px auto;
    }
    .profile-images-123 {
        display: flex; align-items: center; margin-right: 20px;
    }
    .profile-images-123 img {
        width: 30px; height: 30px; border-radius: 50%;
        margin-right: -10px; border: 2px solid white;
    }
    .rating-123 { display: flex; align-items: center; }
    .rating-text-123 { font-size: 14px; }
    .highlight-123 { color: #FF6347; font-weight: bold; }
</style>
<div class="rating-widget-123">
    <div class="profile-images-123">
        <img src="https://cart.tryrapi.com/library/avatars/male-01.jpg" alt="Profile 1">
        <img src="https://cart.tryrapi.com/library/avatars/female-01.jpg" alt="Profile 2">
        <img src="https://cart.tryrapi.com/library/avatars/male-02.jpg" alt="Profile 3">
    </div>
    <div class="rating-123">
        <span class="rating-text-123">Rated <span class="highlight-123">4.5/5</span> based on <span class="highlight-123">+50 Reviews</span></span>
    </div>
</div>`,
  },
  {
    id: "verified-reviews",
    title: "Verified Reviews",
    category: "trust",
    type: "html",
    code: `<style>
    .container-trustpilot {
        background-color: #e9f8fe;
        border: 1px dashed #006400;
        padding: 5px 5px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 10px; flex-wrap: wrap; margin: 10px 0;
    }
    .container-trustpilot .stars { width: 90px; height: auto; margin: 0 10px; }
    .container-trustpilot span { margin: 0 5px; }
    .container-trustpilot .rapi-trustpilot-excellent { color: #000; font-size: 12px; }
    .container-trustpilot .rapi-trustpilot-rating-text { color: #000; font-size: 10px; }
</style>
<div class="container-trustpilot">
    <span class="rapi-trustpilot-excellent"><b>"EXCELLENT"</b></span>
    <svg class="stars" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 24">
        <defs>
            <linearGradient id="rapi-half-star-fill">
                <stop offset="50%" stop-color="#00b67a"/>
                <stop offset="50%" stop-color="#dddddd"/>
            </linearGradient>
        </defs>
        <path fill="#00b67a" d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/>
        <path fill="#00b67a" transform="translate(24 0)" d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/>
        <path fill="#00b67a" transform="translate(48 0)" d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/>
        <path fill="#00b67a" transform="translate(72 0)" d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/>
        <path fill="url(#rapi-half-star-fill)" transform="translate(96 0)" d="M12 .587l3.668 7.431L24 9.748l-6 5.832 1.42 8.271L12 18.896l-7.42 4.955L6 15.58l-6-5.832 8.332-1.73z"/>
    </svg>
    <span class="rapi-trustpilot-rating-text">Rated 4.4/5 — Verified Reviews</span>
</div>`,
  },
  {
    id: "benefits-list",
    title: "Benefits List",
    category: "features",
    type: "html",
    code: `<style>
  p {
    font-size: 14px; line-height: 1.2;
    text-align: center; margin: 6px 0;
  }
</style>
<p>🗸 Ultra fast charging</p>
<p>🗸 Portable, take it anywhere!</p>
<p>🗸 Enhance Endurance</p>`,
  },
  {
    id: "benefits-emojis",
    title: "Benefits list (with emojis)",
    category: "features",
    type: "html",
    code: `<style>
  p {
    font-size: 14px; line-height: 1.2;
    text-align: center; margin: 6px 0;
  }
</style>
<p><strong>🍒 Reshapes figure naturally</strong></p>
<p><strong>❤️ Seamless and easy application</strong></p>
<p><strong>✅ Complete comfort</strong></p>`,
  },
  {
    id: "product-usps",
    title: "Product USPs",
    category: "features",
    type: "html",
    code: `<div class="item__content-container">
<div class="item__content">
    <div class="item">
        <svg class="frequency_list_checkmark" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.6562 4.21899L6.09375 10.7812L2.8125 7.50024" stroke="#00B67A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
       <strong> FREE SHIPPING </strong> on first order
    </div>
    <div class="item">
        <svg class="frequency_list_checkmark" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.6562 4.21899L6.09375 10.7812L2.8125 7.50024" stroke="#00B67A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <strong>NO CONTRACT </strong> cancel easily
    </div>
    <div class="item">
        <svg class="frequency_list_checkmark" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.6562 4.21899L6.09375 10.7812L2.8125 7.50024" stroke="#00B67A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
       <strong> 15% OFF </strong> future orders
    </div>
    <div class="item">
        <svg class="frequency_list_checkmark" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.6562 4.21899L6.09375 10.7812L2.8125 7.50024" stroke="#00B67A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
       <strong>OUT OF STOCK PROTECTION</strong>
    </div>
</div>
</div>
<style>
    .item__content{
        display: grid; gap: 10px;
        grid-template-columns: 1fr 1fr;
        margin: 10px 0;
    }
    .item{
        justify-content: flex-start; align-items: flex-start;
        width: 100%; margin-bottom: 0; line-height: 1.45;
        display: flex; gap: 5px; font-size: 10px;
    }
</style>`,
  },
  {
    id: "made-in-usa",
    title: "Made in USA",
    category: "trust",
    type: "html",
    code: `<style>
    .usa-widget-7907 { text-align: center; margin: 10px 0; }
    .usa-text-7907 {
        font-size: 14px; color: #333333;
        display: flex; align-items: center; justify-content: center;
    }
    .usa-text-7907 img {
        width: 20px; height: 20px; margin-right: 8px;
    }
</style>
<div class="usa-widget-7907">
    <div class="usa-text-7907">
        <img src="https://cart.tryrapi.com/library/icons/flag-usa.svg" alt="Made in USA Icon">
        Proudly Made in USA
    </div>
</div>`,
  },
  {
    id: "top-selling",
    title: "Top Selling",
    category: "social-proof",
    type: "html",
    code: `<style>
    .unique-top-badge-LmN123 {
        display: flex; align-items: center;
        background-color: #f3e5ff;
        padding: 5px 10px; border-radius: 8px;
        font-family: Arial, sans-serif; font-size: 14px;
        color: #333; width: fit-content; margin: 10px auto;
    }
    .unique-top-badge-LmN123 svg {
        margin-right: 8px; width: 20px; height: 20px;
    }
    .unique-top-badge-LmN123 span { font-weight: bold; }
</style>
<div class="unique-top-badge-LmN123">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.89 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
    <span>Top selling product in Kitchen Gadgets category</span>
</div>`,
  },
  {
    id: "money-back-limited",
    title: "Money Back & Limited Stock",
    category: "trust",
    type: "html",
    code: `<style>
.unique-container-Abc456 {
  display: flex; justify-content: center; align-items: center;
  gap: 10px; margin: 10px 0;
}
.unique-badge-Def789 {
  display: inline-flex; align-items: center;
  background-color: #e0ffd8; color: #004d00;
  padding: 2px 4px; border-radius: 3px;
  font-size: 10px; font-weight: bold;
}
.unique-badge-Ghi012 {
  display: inline-flex; align-items: center;
  background-color: #ffdede; color: #b22222;
  padding: 2px 4px; border-radius: 3px;
  font-size: 10px; font-weight: bold;
}
.unique-icon-Jkl345 {
  width: 12px; height: 12px;
  margin-right: 2px; vertical-align: middle;
}
@keyframes unique-rotate-Mno678 {
  from { transform: rotate(0deg); } to { transform: rotate(360deg); }
}
.unique-clock-hand-Pqr901 {
  transform-origin: 50% 50%;
  animation: unique-rotate-Mno678 2s linear infinite;
}
</style>
<div class="unique-container-Abc456">
  <div class="unique-badge-Def789">
    <span>
      <svg class="unique-icon-Jkl345" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#004d00" d="M12 2C9.24 2 7 4.24 7 7V10H5C3.9 10 3 10.9 3 12V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12C21 10.9 20.1 10 19 10H17V7C17 4.24 14.76 2 12 2M12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4M12 12C13.1 12 14 12.9 14 14C14 15.1 13.1 16 12 16C10.9 16 10 15.1 10 14C10 12.9 10.9 12 12 12Z"/>
      </svg>
      30-day money back guarantee.
    </span>
  </div>
  <div class="unique-badge-Ghi012">
    <span>
      <svg class="unique-icon-Jkl345" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="#b22222" stroke-width="2" fill="none"/>
        <line x1="12" y1="12" x2="12" y2="6" stroke="#b22222" stroke-width="2" class="unique-clock-hand-Pqr901"/>
        <line x1="12" y1="12" x2="16" y2="12" stroke="#b22222" stroke-width="2"/>
      </svg>
      Limited stock available!
    </span>
  </div>
</div>`,
  },
  {
    id: "loved-product",
    title: "Loved Product",
    category: "social-proof",
    type: "html",
    code: `<style>
    .notification-XY123 {
        display: flex; align-items: center;
        font-family: Arial, sans-serif; font-size: 16px;
        color: #333; width: fit-content; margin: 10px auto;
    }
    .icon-ZA456 { margin-right: 5px; }
    .icon-ZA456 img { width: 24px; }
    .highlight-DE012 {
        color: #000; font-weight: bold;
        animation: pulse-FG345 1.5s infinite;
    }
    @keyframes pulse-FG345 {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
</style>
<div class="notification-XY123">
    <div class="icon-ZA456">
        <img src="https://cart.tryrapi.com/library/icons/heart.svg" alt="Heart Icon">
    </div>
    <span>Loved product! <span class="highlight-DE012">1.1M people</span> favorited it!</span>
</div>`,
  },
  {
    id: "less-than-1",
    title: "Less than 1%",
    category: "trust",
    type: "html",
    code: `<style>
  .vsless-than-block {
    background: #DFE4E7; border-radius: 8px;
    padding: 24px 36px; display: flex; align-items: center;
    margin: 24px 0 0 0; gap: 20px;
  }
  .product-main_mbg-icon {
    width: 63px; min-width: 63px; height: auto;
  }
  @media screen and (min-width: 950px) {
    .product-main_mbg-icon {
      width: 96px; min-width: 96px; height: auto;
    }
  }
</style>
<div class="vsless-than-block">
  <img src="https://cart.tryrapi.com/library/icons/money-back-guarantee.svg" alt="Money Back Guarantee" width="288" height="288" class="product-main_mbg-icon">
  <p><strong>Less than 1%</strong> of customers claim <br> our Money Back Guarantee</p>
</div>`,
  },
  {
    id: "fb-viral",
    title: "Recently Viral on Facebook",
    category: "social-proof",
    type: "html",
    code: `<style>
  .pill-container {
    padding: 8px 12px; background-color: #1877F2;
    border-radius: 20px; display: inline-block; position: relative;
  }
  .pill-container img { vertical-align: middle; }
  .pill-container span { margin-left: 8px; color: #ffffff; }
  .center {
    display: flex; justify-content: center;
    align-items: center; margin: 10px 0;
  }
  .pill-border {
    position: absolute; top: -4px; left: -4px;
    right: -4px; bottom: -4px; border-radius: 24px;
    background: linear-gradient(135deg, #26F0FF, #E82356);
    z-index: -1;
  }
</style>
<div class="center">
  <div class="pill-container">
    <div class="pill-border"></div>
    <img src="https://cart.tryrapi.com/library/social/facebook-logo.png" alt="Facebook Logo">
    <span>Over 4M Views on Facebook</span>
  </div>
</div>`,
  },
  {
    id: "risk-free-30",
    title: "Try it risk free for 30 days",
    category: "trust",
    type: "html",
    code: `<style>
  .red-div-wrapper { text-align: center; margin: 10px 0; }
  .red-div {
    background-color: #BFE0FF; padding: 2px 10px;
    border-radius: 8px; display: inline-block;
    color: #135F96; font-weight: 500; font-size: 12px;
  }
</style>
<div class="red-div-wrapper">
  <div class="red-div">
    <span>Try it, risk free for 30 days!</span>
  </div>
</div>`,
  },
  {
    id: "money-back-v2",
    title: "30-day money back V2",
    category: "trust",
    type: "html",
    code: `<div class="unique-container-Abc123Xyz" style="background-color: white; border: 1px solid #E2E2E2; border-radius: 10px; padding: 10px; margin-top: 5px; margin-bottom: 5px; position: relative; overflow: hidden;">
  <div class="unique-circle-Abc123Xyz"></div>
  <span class="unique-text-Abc123Xyz" style="margin-left: 10px; font-size: 16px;">30-day money back Guarantee</span>
</div>
<style>
  @keyframes unique-glow-Abc123Xyz {
    0% { box-shadow: 0 0 5px 0 rgba(0, 255, 0, 0.7); }
    50% { box-shadow: 0 0 15px 5px rgba(0, 255, 0, 0.5); }
    100% { box-shadow: 0 0 5px 0 rgba(0, 255, 0, 0.7); }
  }
  .unique-circle-Abc123Xyz {
    width: 10px; height: 10px; border-radius: 50%;
    background-color: #006400; display: inline-block;
    animation: unique-glow-Abc123Xyz 1s infinite ease-in-out;
  }
</style>`,
  },
  {
    id: "deals-timer",
    title: "Deals Timer",
    category: "sales",
    type: "html",
    code: `<style>
    .unique-deal-banner-Abc123 {
        display: flex; border-radius: 15px; overflow: hidden;
        font-family: 'Arial', sans-serif; font-size: 14px; margin: 10px 0;
    }
    .unique-deal-text-container-Abc123 {
        background-color: #ff4d4d; padding: 10px 20px;
        display: flex; align-items: center;
    }
    .unique-deal-text-Abc123 { font-weight: 700; color: white; }
    .unique-deal-timer-container-Abc123 {
        background-color: #ff6666; padding: 10px 20px;
        display: flex; align-items: center; justify-content: center;
        flex-grow: 1;
    }
    .unique-deal-timer-Abc123 {
        font-size: 16px; font-weight: 700; color: white;
        animation: unique-timerAnimation-Abc123 1s ease-in-out infinite alternate;
    }
    @keyframes unique-timerAnimation-Abc123 {
        0% { transform: scale(1); } 100% { transform: scale(1.1); }
    }
</style>
<div class="unique-deal-banner-Abc123">
    <div class="unique-deal-text-container-Abc123">
        <span class="unique-deal-text-Abc123">SuperDeals</span>
    </div>
    <div class="unique-deal-timer-container-Abc123">
        <span class="unique-deal-timer-Abc123">Ends: 9d : 18 : 22 : 13</span>
    </div>
</div>`,
  },
  {
    id: "special-sale",
    title: "Special Sale",
    category: "sales",
    type: "html",
    code: `<style>
    .unique-sale-badge-XyZ123 {
        display: flex; align-items: center;
        font-size: 14px; color: #ff9900;
        width: fit-content; margin: 10px auto;
    }
    .unique-highlight-AbC456 {
        background-color: #ffe6cc; padding: 2px 5px;
        border-radius: 3px; font-weight: bold; color: #ff9900;
        display: inline-flex; align-items: center;
    }
    .unique-separator-GhI012 { margin: 0 10px; }
    .unique-extra-JkL345 {
        display: inline-flex; align-items: center;
        color: #ff9900; font-weight: bold;
        animation: unique-blink-MnO678 1s infinite;
    }
    @keyframes unique-blink-MnO678 {
        0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
    }
</style>
<div class="unique-sale-badge-XyZ123">
    <div class="unique-highlight-AbC456">
        <span>Special sale</span>
    </div>
    <div class="unique-separator-GhI012">|</div>
    <div class="unique-extra-JkL345">
        <span>Hurry, Limited Stock!</span>
    </div>
</div>`,
  },
  {
    id: "views-tiktok",
    title: "Views on TikTok",
    category: "social-proof",
    type: "html",
    code: `<style>
  .unique-tiktok-badge-D4E5F6 {
    display: flex; align-items: center; justify-content: center;
    background-color: #000; border-radius: 7px;
    color: #fff; font-size: 14px; font-weight: bold;
    padding: 5px 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    border: 3px solid transparent; background-clip: padding-box;
    position: relative; height: 35px; width: 100%;
    max-width: 250px; text-align: center; margin: 10px auto;
  }
  .unique-tiktok-badge-D4E5F6::before {
    content: ''; position: absolute;
    top: -3px; left: -3px; right: -3px; bottom: -3px;
    border-radius: 7px;
    background: linear-gradient(45deg, #fe2c55, #25f4ee, #fe2c55, #25f4ee);
    background-size: 200% 200%;
    animation: unique-gradient-animation-G7H8I9 3s linear infinite;
    z-index: -1;
  }
  @keyframes unique-gradient-animation-G7H8I9 {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>
<div class="unique-tiktok-badge-D4E5F6">
  <div>Over 4 Million Views On TikTok</div>
</div>`,
  },
  {
    id: "views-instagram",
    title: "Views on Instagram",
    category: "social-proof",
    type: "html",
    code: `<style>
  .unique-instagram-badge-D4E5F6 {
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(45deg, #fdc830, #f37335, #e1306c, #405de6);
    border-radius: 7px; color: #fff; font-size: 14px; font-weight: bold;
    padding: 5px 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    position: relative; height: 35px; width: 100%;
    max-width: 300px; text-align: center; margin: 10px auto;
  }
</style>
<div class="unique-instagram-badge-D4E5F6">
  <div>Over 4 Million Views On Instagram</div>
</div>`,
  },
  {
    id: "views-facebook",
    title: "Views on Facebook",
    category: "social-proof",
    type: "html",
    code: `<style>
  .unique-facebook-badge-Rty456 {
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(45deg, #4267B2, #3b5998);
    border-radius: 7px; color: #fff; font-size: 14px; font-weight: bold;
    padding: 5px 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    position: relative; height: 35px; width: 100%;
    max-width: 300px; text-align: center; margin: 10px auto;
  }
</style>
<div class="unique-facebook-badge-Rty456">
  <div>Over 4 Million Views On Facebook</div>
</div>`,
  },
  {
    id: "fast-shipping",
    title: "Fast shipping & 24/7 support",
    category: "trust",
    type: "html",
    code: `<style>
    .unique-badge-container-xyz123 {
        display: flex; gap: 5px;
        justify-content: center; margin: 10px 0;
    }
    .unique-badge-abc456 {
        display: flex; align-items: center;
        padding: 3px 7px; border-radius: 12px;
        font-size: 10px; font-weight: bold;
        color: #000; background-color: rgba(0, 0, 0, 0.05);
    }
    .unique-badge-abc456 img {
        margin-right: 3px; filter: brightness(0.5);
    }
</style>
<div class="unique-badge-container-xyz123">
    <div class="unique-badge-abc456">
        <img src="https://cart.tryrapi.com/library/icons/plane.svg" alt="Fast Shipping" width="12" height="12">
        Fast Shipping
    </div>
    <div class="unique-badge-abc456">
        <img src="https://cart.tryrapi.com/library/icons/support.svg" alt="24/7 Support" width="12" height="12">
        24/7 Support
    </div>
    <div class="unique-badge-abc456">
        <img src="https://cart.tryrapi.com/library/icons/return.svg" alt="30 Days Return" width="12" height="12">
        30 Days Return
    </div>
</div>`,
  },
  {
    id: "mothers-day",
    title: "Mother's Day Sale",
    category: "sales",
    type: "html",
    code: `<div class="loved-by-customers">
  <span>🎁 <span style="font-weight: medium;">Mothers Day! (Buy 2 for 20% OFF)</span></span>
</div>
<style>
  .loved-by-customers {
    background: linear-gradient(#FFD1D1, #FFB4B4);
    color: #AF1414; text-align: center;
    padding: 6px; margin-top: 20px;
    border-radius: 20px; width: 300px;
    margin-left: auto; margin-right: auto;
    font-size: 14px;
  }
</style>`,
  },
  {
    id: "free-gift",
    title: "You've unlocked a free gift at checkout!",
    category: "sales",
    type: "html",
    code: `<style>
  .red-div-wrapper { text-align: center; margin: 10px 0; }
  .red-div {
    background-color: #D0FFE0; padding: 2px 10px;
    border-radius: 8px; display: inline-block;
    color: #008454; font-weight: 500; font-size: 12px;
  }
  .rapi-red-div-mark {
    color: inherit; font-size: 12px; margin-right: 5px;
  }
</style>
<div class="red-div-wrapper">
  <div class="red-div">
    <span class="rapi-red-div-mark">✔</span>
    <span>You unlocked a Free Gift at Checkout!</span>
  </div>
</div>`,
  },
  {
    id: "free-shipping-icon",
    title: "Free shipping with icon",
    category: "trust",
    type: "html",
    code: `<div style="display: flex; align-items: center; justify-content: center; color: #00493B; margin: 10px 0;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#00493B" viewBox="0 0 20 20">
        <path fill="#00493B" d="M1.45831 4.16675c-.34505 0-.624997.27995-.624997.625s.279947.625.624997.625h5.41667c.34505 0 .625.27995.625.625s-.27995.625-.625.625H1.45831c-.34505 0-.624997.27995-.624997.625s.279947.625.624997.625h3.75c.34506 0 .625.27995.625.625s-.27994.625-.625.625h-3.75c-.34505 0-.624997.27995-.624997.625s.279947.62495.624997.62495h2.08334c.34505 0 .625.28.625.625 0 .3451-.27995.625-.625.625H1.45831c-.34505 0-.624997.28-.624997.625v.8334c0 1.033.842017 1.875 1.874997 1.875h.29731c.27344.9592 1.15669 1.6666 2.20269 1.6666 1.04601 0 1.92926-.7074 2.20269-1.6666h3.839V6.04175c0-1.03299-.842-1.875-1.87502-1.875H1.45831ZM12.5 5.83341v8.54169c0 1.263 1.0286 2.2916 2.2916 2.2916 1.0461 0 1.9293-.7074 2.2027-1.6666h.2973c1.0374 0 1.875-.8377 1.875-1.875v-2.6498c0-.2625-.0542-.52513-.1627-.76168L17.7756 6.9467c-.2995-.67492-.9701-1.11329-1.7123-1.11329H12.5Zm1.6666 1.25h1.8967c.2474 0 .471.1454.5708.3711l.6836 1.54297c.1237.27561-.0781.58594-.3798.58594h-2.7713c-.23 0-.4166-.18664-.4166-.41667V7.50008c0-.23003.1866-.41667.4166-.41667ZM5.20831 13.3334c.57509 0 1.04167.4666 1.04167 1.0417 0 .5751-.46658 1.0416-1.04167 1.0416-.57508 0-1.04166-.4665-1.04166-1.0416 0-.5751.46658-1.0417 1.04166-1.0417Zm9.58329 0c.5751 0 1.0417.4666 1.0417 1.0417 0 .5751-.4666 1.0416-1.0417 1.0416-.575 0-1.0416-.4665-1.0416-1.0416 0-.5751.4666-1.0417 1.0416-1.0417Z"/>
    </svg>
    <span style="margin-left: 5px; font-weight: medium;">Free Shipping on orders £30+</span>
</div>`,
  },
  {
    id: "summer-sale",
    title: "Summer Sale",
    category: "sales",
    type: "html",
    code: `<div class="sale-banner">
  <p><strong>Summer Sale now on!</strong></p>
  <p>25% off subscriptions, 15% off everything else</p>
</div>
<style>
.sale-banner {
  border: 2px dashed black; padding: 14px;
  background-color: #FAFAFA; width: fit-content;
  font-family: Arial, sans-serif;
  border-radius: 6px; margin: 10px auto;
}
.sale-banner p { margin: 0; font-size: 14px; color: black; }
.sale-banner p strong { font-size: 16px; color: black; }
</style>`,
  },
  {
    id: "wholesale",
    title: "Wholesale",
    category: "sales",
    type: "html",
    code: `<style>
    .unique-deal-badge-Qwe123 {
        display: flex; align-items: center;
        font-size: 14px; width: fit-content; margin: 10px auto;
    }
    .unique-highlight-Asd456 {
        background-color: #fdecea; padding: 2px 5px;
        border-radius: 3px; font-weight: bold; color: #d9534f;
        border: 1px solid #f5c6c6;
        display: inline-flex; align-items: center;
    }
    .unique-extra-Rty012 {
        color: #d9534f; margin-left: 15px;
        animation: unique-pulse-Fgh345 2s infinite;
    }
    @keyframes unique-pulse-Fgh345 {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
</style>
<div class="unique-deal-badge-Qwe123">
    <div class="unique-highlight-Asd456">
        <span>Wholesale</span>
    </div>
    <div class="unique-extra-Rty012">2+ pieces, extra 5% off</div>
</div>`,
  },
  {
    id: "valentines",
    title: "Valentine's Sale",
    category: "sales",
    type: "html",
    code: `<style>
  .unique-badge-container-Def456 {
    display: flex; align-items: center;
    background-color: #ffe6f7; border-radius: 12px;
    padding: 8px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-size: 14px; color: #d6336c;
    width: fit-content; margin: 10px auto;
  }
  .unique-badge-icon-Ghi789 {
    width: 20px; height: 20px; margin-right: 8px;
    animation: unique-pulse-Mno345 1s infinite;
  }
  @keyframes unique-pulse-Mno345 {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
</style>
<div class="unique-badge-container-Def456">
  <svg class="unique-badge-icon-Ghi789" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="#d6336c"/>
  </svg>
  <span>Valentine's Sale Ending Soon!</span>
</div>`,
  },
  {
    id: "christmas",
    title: "Christmas Sale",
    category: "sales",
    type: "html",
    code: `<style>
  .unique-badge-container-Qrs456 {
    display: flex; align-items: center;
    background-color: #e6ffe6; border-radius: 12px;
    padding: 8px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-size: 14px; color: #5cb85c;
    width: fit-content; margin: 10px auto;
    transition: transform 0.3s ease-in-out;
  }
  .unique-badge-icon-Tuv789 {
    margin-right: 8px; font-size: 20px;
  }
</style>
<div class="unique-badge-container-Qrs456">
  <span class="unique-badge-icon-Tuv789">🎄</span>
  <span>Christmas Sale Ending Soon!</span>
</div>`,
  },
  {
    id: "new-year",
    title: "New Year Sale",
    category: "sales",
    type: "html",
    code: `<style>
  .unique-badge-container-Abc890 {
    display: flex; align-items: center;
    background-color: #ffffe6; border-radius: 12px;
    padding: 8px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-size: 14px; color: #f0ad4e;
    width: fit-content; margin: 10px auto;
  }
  .unique-badge-icon-Def123 {
    margin-right: 8px; font-size: 20px;
  }
</style>
<div class="unique-badge-container-Abc890">
  <span class="unique-badge-icon-Def123">🎉</span>
  <span>New Year Sale Ending Soon!</span>
</div>`,
  },
  {
    id: "halloween",
    title: "Halloween Sale",
    category: "sales",
    type: "html",
    code: `<style>
  .unique-badge-container-Hel456 {
    display: flex; align-items: center;
    background-color: #ff7518; border-radius: 12px;
    padding: 8px 12px; box-shadow: 0 4px 6px rgba(255, 117, 24, 0.5);
    font-size: 14px; color: #fff;
    width: fit-content; margin: 10px auto;
  }
  .unique-badge-icon-Hel789 {
    margin-right: 8px; font-size: 20px; color: #fff;
  }
</style>
<div class="unique-badge-container-Hel456">
  <span class="unique-badge-icon-Hel789">🎃</span>
  <span>Halloween Sale Ending Soon!</span>
</div>`,
  },
  {
    id: "easter",
    title: "Easter Sale",
    category: "sales",
    type: "html",
    code: `<style>
  .badge-container-easter {
    display: flex; align-items: center;
    background-color: #ffeb3b; border-radius: 12px;
    padding: 8px 12px; box-shadow: 0 4px 6px rgba(255, 235, 59, 0.5);
    font-size: 14px; color: #000;
    width: fit-content; margin: 10px auto;
  }
  .badge-icon-easter {
    margin-right: 8px; font-size: 20px; color: #000;
  }
</style>
<div class="badge-container-easter">
  <span class="badge-icon-easter">🎁</span>
  <span>Easter Sale Ending Soon!</span>
</div>`,
  },
  {
    id: "coupon-won",
    title: "Coupon Won",
    category: "coupons",
    type: "html",
    code: `<style>
    .discount-banner-x1234 {
        display: flex; align-items: center;
        justify-content: flex-start;
        background-color: #f5f5f5; padding: 10px 15px;
        border: 1px solid #dcdcdc; border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-size: 12px; width: 100%;
        margin: 3px 0;
    }
    .discount-banner-x1234 span {
        color: #333333; display: flex; align-items: center;
    }
    .coupon-code-x1234 {
        font-weight: bold; color: #333333;
        display: inline-flex; align-items: center;
        margin-left: 8px;
    }
    .coupon-icon-x1234 {
        width: 20px; height: 20px; margin-right: 8px;
        animation: floatAndRotate-x1234 5s infinite;
    }
    @keyframes floatAndRotate-x1234 {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-5px) rotate(-5deg); }
        50% { transform: translateY(0) rotate(0deg); }
        75% { transform: translateY(5px) rotate(5deg); }
    }
</style>
<div class="discount-banner-x1234">
    <img class="coupon-icon-x1234" src="https://cart.tryrapi.com/library/icons/confetti.svg" alt="Confetti Icon">
    <span>You've won an extra 10% off coupon code: 
        <strong class="coupon-code-x1234">SUMMER10</strong>
    </span>
</div>`,
  },
  {
    id: "black-friday-coupon",
    title: "Black Friday Coupon",
    category: "coupons",
    type: "html",
    code: `<style>
    .discount-banner-bf2024 {
        display: flex; align-items: center;
        justify-content: flex-start;
        background-color: #f5f5f5; padding: 10px 15px;
        border: 1px solid #dcdcdc; border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-size: 12px; width: 100%; margin: 3px 0;
    }
    .discount-banner-bf2024 span {
        color: #333333; display: flex; align-items: center;
    }
    .coupon-code-bf2024 {
        font-weight: bold; color: #333333;
        display: inline-flex; align-items: center;
        margin-left: 8px;
    }
    .coupon-icon-bf2024 {
        width: 20px; height: 20px; margin-right: 8px;
        animation: floatAndRotate-bf2024 5s infinite;
    }
    @keyframes floatAndRotate-bf2024 {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-5px) rotate(-5deg); }
        50% { transform: translateY(0) rotate(0deg); }
        75% { transform: translateY(5px) rotate(5deg); }
    }
</style>
<div class="discount-banner-bf2024">
    <img class="coupon-icon-bf2024" src="https://cart.tryrapi.com/library/icons/confetti.svg" alt="Confetti Icon">
    <span>Black Friday Special! Extra 20% off coupon code: 
        <strong class="coupon-code-bf2024">BF2024</strong>
    </span>
</div>`,
  },
];
