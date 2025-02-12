import admin from "firebase-admin";
import db from "./config/firebase.js"; // Asegúrate de importar tu configuración de Firebase


// Palabras clave para identificar complementos
const KEYWORDS = ["funda", "carcasa", "cargador", "caja"];
const PRICE_THRESHOLD = 20; // Precio máximo para considerar como complemento

async function processTerminatedProducts() {
    try {
        const terminatedCollection = db.collection("terminados");
        const terminatedModels = await terminatedCollection.listDocuments();

        for (const modelDoc of terminatedModels) {
            const modelName = modelDoc.id;
            const productsSnapshot = await modelDoc.collection("products").get();

            console.log(`Procesando productos para el modelo: ${modelName}`);

            for (const productDoc of productsSnapshot.docs) {
                const productData = productDoc.data();
                const { titulo = "", precio = 0 } = productData;

                // Verificar si el título contiene alguna palabra clave y el precio es inferior al umbral
                if (
                    KEYWORDS.some((keyword) => titulo.toLowerCase().includes(keyword)) &&
                    precio < PRICE_THRESHOLD
                ) {
                    console.log(`Producto identificado como complemento: ${titulo} (${precio}€)`);

                    // Mover a la colección "complementos"
                    const complementRef = db
                        .collection("complementos")
                        .doc(modelName)
                        .collection("products")
                        .doc(productDoc.id);

                    await complementRef.set({
                        ...productData,
                        movedToComplementAt: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    // Opcional: Eliminar el producto de "terminados"
                    await productDoc.ref.delete();
                    console.log(`Producto movido a complementos/${modelName}/products.`);
                }
            }
        }

        console.log("Proceso completado.");
    } catch (error) {
        console.error("Error procesando productos terminados:", error);
    }
}

// Ejecutar el script
processTerminatedProducts();