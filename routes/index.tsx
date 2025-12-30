import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import PhoneValidator from "../islands/PhoneValidator.tsx";

export default define.page(function PhoneValidatorPage() {
  return (
    <div class="min-h-screen bg-gray-100">
      <Head>
        <title>Phone Validator - Validate Phone Numbers</title>
      </Head>
      <div class="px-4 py-8">
        <div class="max-w-6xl mx-auto">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Phone Validator</h1>
          <p class="text-gray-600 mb-6">
            Validate international phone numbers with support for strict mode and type filtering.
          </p>
          <PhoneValidator />
        </div>
      </div>
    </div>
  );
});
