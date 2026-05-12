using EventFinder.Application.Interfaces;
using EventFinder.Application.Mapping;
using EventFinder.Application.Services;
using EventFinder.Infrastructure.Data;
using EventFinder.Infrastructure.Data.Repositories;
using EventFinder.Infrastructure.Identity;
using EventFinder.Infrastructure.Options;
using EventFinder.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace EventFinder.API
{
    public class Program
    {
        public async static Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddAutoMapper(config =>
                config.AddProfile<MappingProfile>());

            builder.Services.AddScoped(typeof(IRepository<>), typeof(RepositoryBase<>));
            builder.Services.AddScoped<IEventService, EventService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IReviewService, ReviewService>();

            builder.Services.AddControllers().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(
                    new System.Text.Json.Serialization.JsonStringEnumConverter());
                options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            }); ;

            builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
            builder.Services.Configure<SmtpOptions>(
                builder.Configuration.GetSection("MailerSend"));

            /*builder.Services.Configure<MailerSendOptions>(
                builder.Configuration.GetSection("MailerSend"));

            builder.Services.AddHttpClient();

            builder.Services.AddScoped<IEmailSender, MailerSendEmailSender>();*/

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(connectionString));

            builder.Services.AddDbContext<AppIdentityDbContext>(options =>
                options.UseNpgsql(connectionString));

            builder.Services
                .AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<AppIdentityDbContext>()
                .AddDefaultTokenProviders();

            builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
            builder.Services.Configure<AppOptions>(builder.Configuration.GetSection("App"));


            builder.Services.AddScoped<IAuthService, AuthService>();

            var jwtOptions = builder.Configuration.GetSection("Jwt");
            builder.Services.Configure<JwtOptions>(jwtOptions);
            builder.Services.AddScoped<ITokenClaimsService, IdentityTokenClaimService>();

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwtOptions["Issuer"],
                    ValidAudience = jwtOptions["Audience"],
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtOptions["Key"]!))
                };
            });

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins("https://alexthunder2005.github.io")
                       .AllowAnyMethod()
                       .AllowAnyHeader()
                       .AllowCredentials(); 
                    });
            });

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;

                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    await ApplicationDbContextSeed.SeedAsync(context, app.Logger);

                    var identityContext = services.GetRequiredService<AppIdentityDbContext>();
                    await AppIdentityDbContextSeed.SeedAsync(identityContext);
                }
                catch (Exception ex)
                {
                    app.Logger.LogError(ex, "An error occurred migrating the DB.");
                }
            }

            // Configure the HTTP request pipeline.
            app.UsePathBase("/app");
            app.UseStaticFiles();
            app.UseCors();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}