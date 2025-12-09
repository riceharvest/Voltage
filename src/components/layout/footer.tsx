export function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>⚠️ <strong>Important Safety Notice:</strong> This guide is for educational purposes only. Energy drinks contain stimulants that can be dangerous if misused. Always follow EU regulations and consult healthcare professionals.</p>

          <p><strong>Emergency Contacts:</strong></p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-2">
            <a
              href="tel:030-2748888"
              className="text-primary hover:underline"
              aria-label="Nationaal Vergiftigingen Informatie Centrum"
            >
              🆘 Poison Control (NVIC): 030-2748888
            </a>
            <span className="hidden sm:inline">|</span>
            <a
              href="tel:112"
              className="text-primary hover:underline"
              aria-label="European Emergency Number"
            >
              🚑 Emergency: 112
            </a>
          </div>

          <p><strong>Liability Disclaimer:</strong> The information provided is not medical advice. Users assume all risks associated with creating and consuming energy drinks. We are not liable for any injuries, health issues, or damages resulting from the use of this information.</p>

          <p className="mt-4">© 2024 Energy Drink Guide - Netherlands Edition</p>
        </div>
      </div>
    </footer>
  )
}