FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY *.sln .
COPY LibraryManagementSystem.API/*.csproj LibraryManagementSystem.API/
COPY LibraryManagementSystem.Application/*.csproj LibraryManagementSystem.Application/
COPY LibraryManagementSystem.Domain/*.csproj LibraryManagementSystem.Domain/
COPY LibraryManagementSystem.Infrastructure/*.csproj LibraryManagementSystem.Infrastructure/

RUN dotnet restore

COPY . .
RUN dotnet publish LibraryManagementSystem.API -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "LibraryManagementSystem.API.dll"]