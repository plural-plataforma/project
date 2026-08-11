using System.Text.Json.Serialization;

namespace api.DTOs.Webhooks
{
    // DTO raiz do webhook v2.0.0
    public class HotmartWebhookV2Dto
    {
        public string? Id { get; set; }

        [JsonPropertyName("creation_date")]
        public long? CreationDate { get; set; }

        public string? Event { get; set; }  // "PURCHASE_APPROVED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", etc.
        public string? Version { get; set; }
        public HotmartWebhookDataDto? Data { get; set; }
        public string? Hottok { get; set; }
    }

    public class HotmartWebhookDataDto
    {
        public HotmartProductDataDto? Product { get; set; }
        public List<HotmartAffiliateDto>? Affiliates { get; set; }
        public HotmartBuyerDto? Buyer { get; set; }
        public HotmartProducerDto? Producer { get; set; }
        public List<HotmartCommissionDto>? Commissions { get; set; }
        public HotmartPurchaseDataDto? Purchase { get; set; }
        public HotmartSubscriptionDataDto? Subscription { get; set; }
    }

    public class HotmartProductDataDto
    {
        public int Id { get; set; }
        public string? Ucode { get; set; }
        public string? Name { get; set; }

        [JsonPropertyName("warranty_date")]
        public DateTime? WarrantyDate { get; set; }   // prazo de garantia/reembolso — NÃO é vencimento de assinatura

        [JsonPropertyName("support_email")]
        public string? SupportEmail { get; set; }

        [JsonPropertyName("has_co_production")]
        public bool HasCoProduction { get; set; }

        [JsonPropertyName("is_physical_product")]
        public bool IsPhysicalProduct { get; set; }

        public HotmartContentDto? Content { get; set; }
    }

    public class HotmartContentDto
    {
        [JsonPropertyName("has_physical_products")]
        public bool HasPhysicalProducts { get; set; }

        public List<HotmartPhysicalProductDto>? Products { get; set; }
    }

    public class HotmartPhysicalProductDto
    {
        public int Id { get; set; }
        public string? Ucode { get; set; }
        public string? Name { get; set; }

        [JsonPropertyName("is_physical_product")]
        public bool IsPhysicalProduct { get; set; }
    }

    public class HotmartBuyerDto
    {
        public string? Email { get; set; }
        public string? Name { get; set; }

        [JsonPropertyName("first_name")]
        public string? FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public string? LastName { get; set; }

        [JsonPropertyName("checkout_phone_code")]
        public string? CheckoutPhoneCode { get; set; }

        [JsonPropertyName("checkout_phone")]
        public string? CheckoutPhone { get; set; }     // telefone completo

        public HotmartAddressDto? Address { get; set; }
        public string? Document { get; set; }

        [JsonPropertyName("document_type")]
        public string? DocumentType { get; set; }      // "CPF"
    }

    public class HotmartAddressDto
    {
        public string? City { get; set; }
        public string? Country { get; set; }

        [JsonPropertyName("country_iso")]
        public string? CountryIso { get; set; }

        public string? State { get; set; }
        public string? Neighborhood { get; set; }
        public string? Zipcode { get; set; }
        public string? Address { get; set; }
        public string? Number { get; set; }
        public string? Complement { get; set; }
    }

    // Campos mínimos para os outros (pode expandir depois)
    public class HotmartAffiliateDto { /* ... */ }
    public class HotmartProducerDto { /* ... */ }
    public class HotmartCommissionDto { /* ... */ }

    public class HotmartPurchaseDataDto
    {
        [JsonPropertyName("approved_date")]
        public long? ApprovedDate { get; set; }

        [JsonPropertyName("recurrence_number")]
        public int? RecurrenceNumber { get; set; }     // 1 = primeira cobrança, 2+ = renovação

        [JsonPropertyName("date_next_charge")]
        public long? DateNextCharge { get; set; }       // ms desde epoch — data da próxima cobrança (= vencimento do acesso atual)

        public string? Status { get; set; }             // APPROVED, REFUNDED, CHARGEBACK, CANCELLED, etc.
        public string? Transaction { get; set; }
    }

    public class HotmartSubscriptionDataDto
    {
        public string? Status { get; set; }             // ACTIVE, CANCELLED_BY_CUSTOMER, OVERDUE, etc.
        public HotmartSubscriptionPlanDto? Plan { get; set; }
        public HotmartSubscriberDto? Subscriber { get; set; }
    }

    public class HotmartSubscriptionPlanDto
    {
        public long Id { get; set; }
        public string? Name { get; set; }
    }

    public class HotmartSubscriberDto
    {
        public string? Code { get; set; }
    }

    // DTO raiz do evento dedicado SUBSCRIPTION_CANCELLATION — formato de "data" diferente do PURCHASE_APPROVED
    public class HotmartSubscriptionCancellationWebhookDto
    {
        public string? Id { get; set; }

        [JsonPropertyName("creation_date")]
        public long? CreationDate { get; set; }

        public string? Event { get; set; }  // "SUBSCRIPTION_CANCELLATION"
        public string? Version { get; set; }
        public HotmartSubscriptionCancellationDataDto? Data { get; set; }
        public string? Hottok { get; set; }
    }

    public class HotmartSubscriptionCancellationDataDto
    {
        [JsonPropertyName("date_next_charge")]
        public long? DateNextCharge { get; set; }   // acesso vale até essa data, mesmo cancelada

        [JsonPropertyName("cancellation_date")]
        public long? CancellationDate { get; set; }

        public HotmartProductDataDto? Product { get; set; }
        public HotmartSubscriberFullDto? Subscriber { get; set; }
    }

    public class HotmartSubscriberFullDto
    {
        public string? Code { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
    }

    // DTO raiz do evento UPDATE_SUBSCRIPTION_CHARGE_DATE — disparado quando o assinante (ou o
    // produtor) muda o dia de cobrança da assinatura. "data" tem formato próprio, diferente dos
    // outros dois eventos.
    public class HotmartChargeDateUpdateWebhookDto
    {
        public string? Id { get; set; }

        [JsonPropertyName("creation_date")]
        public long? CreationDate { get; set; }

        public string? Event { get; set; }  // "UPDATE_SUBSCRIPTION_CHARGE_DATE"
        public string? Version { get; set; }
        public HotmartChargeDateUpdateDataDto? Data { get; set; }
        public string? Hottok { get; set; }
    }

    public class HotmartChargeDateUpdateDataDto
    {
        public HotmartSubscriberFullDto? Subscriber { get; set; }
        public HotmartChargeDateUpdateSubscriptionDto? Subscription { get; set; }
    }

    public class HotmartChargeDateUpdateSubscriptionDto
    {
        public HotmartProductDataDto? Product { get; set; }

        [JsonPropertyName("old_charge_day")]
        public int? OldChargeDay { get; set; }

        [JsonPropertyName("new_charge_day")]
        public int? NewChargeDay { get; set; }

        // Aqui vem como string ISO-8601 (ex: "2022-09-01T12:00:00.000Z"), diferente dos outros
        // eventos onde date_next_charge vem em milissegundos.
        [JsonPropertyName("date_next_charge")]
        public DateTime? DateNextCharge { get; set; }

        public string? Status { get; set; }
    }
}
