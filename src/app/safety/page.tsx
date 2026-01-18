
import Layout from '@/components/Layout';

export default function SafetyPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Safety Guidelines</h1>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8">
          <h2 className="text-lg font-bold text-red-800 mb-2">CRITICAL WARNING</h2>
          <p className="text-red-700">
            Handling pure caffeine and concentrated ingredients can be dangerous.
            Caffeine overdose can be fatal. The lethal dose of caffeine is estimated to be around 10 grams for adults,
            but serious toxicity can occur at much lower doses.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Essential Equipment</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li><strong>Milligram Scale (0.001g accuracy):</strong> Absolutely required for measuring caffeine and potent extracts. Kitchen scales (1g) are NOT safe for these ingredients.</li>
              <li><strong>Protective Gear:</strong> Wear gloves and a mask when handling pure caffeine powder to avoid accidental inhalation or absorption.</li>
              <li><strong>Clean Containers:</strong> Use dedicated glassware/beakers for mixing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Caffeine Safety</h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-medium text-lg mb-2">Dosage Limits</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>Standard Energy Drink:</strong> 32mg per 100ml (80mg per 250ml can)</li>
                <li><strong>Safe Daily Limit (Adults):</strong> 400mg total from all sources</li>
                <li><strong>Single Dose Limit:</strong> 200mg</li>
              </ul>
              <p className="mt-4 text-sm text-gray-500">
                Never exceed these limits. If you are unsure about your calculation, do not consume the product.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Storage & Labeling</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li><strong>Label Everything:</strong> Clearly label all bottles with contents, concentration, and date.</li>
              <li><strong>Child Safety:</strong> Keep all raw ingredients, especially caffeine and nicotine (if applicable), locked away and out of reach of children and pets.</li>
              <li><strong>Cool & Dark:</strong> Store syrups in the fridge to extend shelf life (typically 1-2 months with preservatives).</li>
            </ul>
          </section>

           <section>
            <h2 className="text-2xl font-semibold mb-4">Legal Disclaimer</h2>
            <p className="text-gray-600">
              This application provides calculations for educational purposes only.
              The creators of Voltage assume no liability for misuse, incorrect measurements,
              or health consequences resulting from the use of this information.
              You are solely responsible for ensuring the safety of your creations.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
