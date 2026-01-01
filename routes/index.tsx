import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import PhoneValidator from "../islands/PhoneValidator.tsx";

export default define.page(function PhoneValidatorPage() {
  return (
    <div class="min-h-screen bg-[#fafafa]">
      <Head>
        <title>Phone Validator</title>
      </Head>
      <div class="px-6 md:px-12 py-8">
        <div class="max-w-6xl mx-auto">
          <h1 class="text-2xl font-normal text-[#111] tracking-tight mb-2">
            Phone Validator
          </h1>
          <p class="text-[#666] text-sm mb-8">
            Validate international phone numbers with support for strict mode and type filtering.
          </p>
          <PhoneValidator />
        </div>
      </div>
    </div>
  );
});
