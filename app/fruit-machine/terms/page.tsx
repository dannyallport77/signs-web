import React from 'react';

export default function FruitMachineTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Fruit Machine Promotion - Terms and Conditions</h1>
          
          <div className="prose prose-indigo max-w-none text-gray-600 space-y-4">
            <p className="font-semibold">Please read these terms and conditions carefully before participating in the Fruit Machine promotion.</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6">1. Eligibility</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The promotion is open to customers who are physically present at the participating business location.</li>
              <li>Participants must be 18 years of age or older to play.</li>
              <li>Employees of the participating business are not eligible to participate.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6">2. How to Play</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>To participate, customers must tap their NFC-enabled smartphone on the designated "Review Signs" tag or scan the QR code provided.</li>
              <li>No purchase is necessary to play, unless otherwise stated by the specific business venue.</li>
              <li>Limit of one spin per person per day, subject to the system's daily limits.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6">3. Prizes</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Prizes are as displayed on the winning screen.</li>
              <li>Prizes are non-transferable and cannot be exchanged for cash (unless the prize is specifically a cash prize).</li>
              <li>The participating business reserves the right to substitute the prize with another of equivalent value without giving notice.</li>
              <li>Prizes must be claimed immediately at the time of winning by showing the winning screen to a staff member. Screenshots are not accepted.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6">4. General</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The "Fruit Machine" game is a promotional tool and the outcome is determined by a random number generator.</li>
              <li>The participating business reserves the right to cancel or amend the promotion and these terms and conditions without notice.</li>
              <li>Any attempt to manipulate the system or use automated means to play will result in disqualification.</li>
              <li>The promoter's decision in respect of all matters to do with the promotion will be final and no correspondence will be entered into.</li>
            </ul>

            <p className="mt-8 text-sm text-gray-500">
              This promotion is powered by Review Signs. Review Signs is not responsible for the fulfillment of prizes, which is the sole responsibility of the participating business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
